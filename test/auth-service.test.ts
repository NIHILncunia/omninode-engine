import { describe, expect, it, vi } from 'vitest';
import type { ApiError } from '../server/utils/api-error';
import { createAuthService } from '../server/services/auth.service';
import type {
  AdminRepository,
  AdminRefreshTokenRepository,
  AuthServiceDependencies,
} from '../server/services/auth.service';

const activeAdmin = {
  id: 1,
  email: 'admin@example.com',
  name: '관리자',
  role: 'ADMIN' as const,
  passwordHash: 'stored-password',
  passwordChangeRequiredYn: 'Y' as const,
  useYn: 'Y' as const,
  delYn: 'N' as const,
};

function createDependencies(): AuthServiceDependencies & {
  admins: AdminRepository;
  refreshTokens: AdminRefreshTokenRepository;
  } {
  const admins: AdminRepository = {
    findByEmail: vi.fn().mockResolvedValue(activeAdmin),
    findById: vi.fn().mockResolvedValue(activeAdmin),
    updateLastSignInDate: vi.fn().mockResolvedValue(undefined),
    updatePassword: vi.fn().mockResolvedValue(undefined),
  };
  const refreshTokens: AdminRefreshTokenRepository = {
    create: vi.fn().mockResolvedValue(undefined),
    findActiveByTokenHash: vi.fn(),
    rotate: vi.fn().mockResolvedValue(true),
    revokeByTokenHash: vi.fn().mockResolvedValue(undefined),
    revokeAllByAdminId: vi.fn().mockResolvedValue(undefined),
  };

  return {
    admins,
    refreshTokens,
    createAccessToken: vi.fn().mockResolvedValue('access-token'),
    createRefreshToken: vi.fn().mockReturnValue('refresh-token'),
    hashRefreshToken: vi.fn().mockReturnValue('refresh-token-hash'),
    hashPassword: vi.fn().mockResolvedValue('new-password-hash'),
    verifyPassword: vi.fn().mockResolvedValue(true),
    verifyAccessToken: vi.fn().mockResolvedValue({
      adminId: 1,
      email: activeAdmin.email,
      role: activeAdmin.role,
      passwordChangeRequired: true,
    }),
    now: () => new Date('2026-08-15T00:00:00.000Z'),
  };
}

describe('인증 서비스', () => {
  it('활성 관리자는 두 토큰을 발급하고 마지막 로그인 시각을 갱신한다', async () => {
    const dependencies = createDependencies();
    const authService = createAuthService(dependencies);

    await expect(authService.signin({
      email: activeAdmin.email,
      password: 'password123',
      deviceInfo: 'test-device',
    })).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      admin: {
        id: activeAdmin.id,
        passwordChangeRequired: true,
      },
    });
    expect(dependencies.refreshTokens.create).toHaveBeenCalledWith({
      adminId: activeAdmin.id,
      tokenHash: 'refresh-token-hash',
      expiresDate: new Date('2026-08-29T00:00:00.000Z'),
      deviceInfo: 'test-device',
    });
    expect(dependencies.admins.updateLastSignInDate).toHaveBeenCalledWith(activeAdmin.id, new Date('2026-08-15T00:00:00.000Z'));
  });

  it('비활성 또는 삭제 관리자의 로그인 실패 사유를 UNAUTHORIZED로 통일한다', async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.admins.findByEmail).mockResolvedValue({
      ...activeAdmin,
      useYn: 'N',
    });
    const authService = createAuthService(dependencies);

    await expect(authService.signin({
      email: activeAdmin.email,
      password: 'password123',
    })).rejects.toMatchObject<ApiError>({
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  });

  it('refresh 토큰을 회전하며 access와 refresh를 함께 재발급한다', async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.refreshTokens.findActiveByTokenHash).mockResolvedValue({
      id: 10,
      adminId: activeAdmin.id,
      expiresDate: new Date('2026-08-20T00:00:00.000Z'),
    });
    const authService = createAuthService(dependencies);

    await expect(authService.refresh({ refreshToken: 'old-refresh-token', })).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(dependencies.refreshTokens.rotate).toHaveBeenCalledWith({
      previousTokenId: 10,
      adminId: activeAdmin.id,
      tokenHash: 'refresh-token-hash',
      expiresDate: new Date('2026-08-29T00:00:00.000Z'),
      deviceInfo: undefined,
    });
  });

  it('비밀번호 변경 시 기존 refresh 토큰을 모두 폐기하고 두 토큰을 새로 발급한다', async () => {
    const dependencies = createDependencies();
    const authService = createAuthService(dependencies);

    await expect(authService.changePassword({
      adminId: activeAdmin.id,
      currentPassword: 'password123',
      newPassword: 'new-password123',
    })).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      admin: { passwordChangeRequired: false, },
    });
    expect(dependencies.admins.updatePassword).toHaveBeenCalledWith(activeAdmin.id, 'new-password-hash', new Date('2026-08-15T00:00:00.000Z'));
    expect(dependencies.refreshTokens.revokeAllByAdminId).toHaveBeenCalledWith(activeAdmin.id, new Date('2026-08-15T00:00:00.000Z'));
  });
});
