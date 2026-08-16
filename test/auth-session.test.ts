import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { ApiError } from '../server/utils/api-error';

const mocks = vi.hoisted(() => ({
  getAuthService: vi.fn(),
  setAuthCookies: vi.fn(),
}));

vi.mock('../server/services/auth.server', () => ({
  getAuthService: mocks.getAuthService,
}));

vi.mock('../server/utils/auth-cookie', () => ({
  accessCookieName: 'omninode_access',
  refreshCookieName: 'omninode_refresh',
  setAuthCookies: mocks.setAuthCookies,
}));

const admin = {
  id: 1,
  email: 'admin@example.com',
  name: '관리자',
  role: 'ADMIN' as const,
  passwordChangeRequired: false,
};

describe('SSR 인증 세션 복원', () => {
  const event = {} as never;
  const getCookie = vi.fn();

  beforeEach(() => {
    getCookie.mockReset();
    mocks.getAuthService.mockReset();
    mocks.setAuthCookies.mockReset();
    vi.stubGlobal('getCookie', getCookie);
  });

  it('유효한 access cookie로 관리자를 복원한다', async () => {
    getCookie.mockImplementation((_: unknown, name: string) => name === 'omninode_access'
      ? 'access-token'
      : undefined);
    const getAuthenticatedAdmin = vi.fn().mockResolvedValue(admin);
    mocks.getAuthService.mockReturnValue({ getAuthenticatedAdmin, });
    const { restoreRequestAdmin, } = await import('../server/utils/auth-session');

    await expect(restoreRequestAdmin(event)).resolves.toEqual(admin);
    expect(getAuthenticatedAdmin).toHaveBeenCalledWith('access-token');
    expect(mocks.setAuthCookies).not.toHaveBeenCalled();
  });

  it('만료된 access와 유효 refresh cookie를 outer 응답 쿠키로 회전한다', async () => {
    getCookie.mockImplementation((_: unknown, name: string) => name === 'omninode_access'
      ? 'expired-access-token'
      : 'refresh-token');
    const getAuthenticatedAdmin = vi.fn().mockRejectedValue(new ApiError(401, 'UNAUTHORIZED'));
    const refresh = vi.fn().mockResolvedValue({
      admin,
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    mocks.getAuthService.mockReturnValue({
      getAuthenticatedAdmin,
      refresh,
    });
    const { restoreRequestAdmin, } = await import('../server/utils/auth-session');

    await expect(restoreRequestAdmin(event)).resolves.toEqual(admin);
    expect(refresh).toHaveBeenCalledWith({
      refreshToken: 'refresh-token',
      deviceInfo: undefined,
    });
    expect(mocks.setAuthCookies).toHaveBeenCalledWith(
      event,
      'new-access-token',
      'new-refresh-token',
    );
  });

  it('access와 refresh가 모두 거부되면 null을 반환한다', async () => {
    getCookie.mockImplementation((_: unknown, name: string) => name === 'omninode_access'
      ? 'expired-access-token'
      : 'expired-refresh-token');
    const getAuthenticatedAdmin = vi.fn().mockRejectedValue(new ApiError(401, 'UNAUTHORIZED'));
    const refresh = vi.fn().mockRejectedValue(new ApiError(401, 'UNAUTHORIZED'));
    mocks.getAuthService.mockReturnValue({
      getAuthenticatedAdmin,
      refresh,
    });
    const { restoreRequestAdmin, } = await import('../server/utils/auth-session');

    await expect(restoreRequestAdmin(event)).resolves.toBeNull();
    expect(mocks.setAuthCookies).not.toHaveBeenCalled();
  });

  it('인증 거부가 아닌 오류는 호출자에게 전파한다', async () => {
    getCookie.mockReturnValue('access-token');
    const unexpectedError = new Error('database unavailable');
    const getAuthenticatedAdmin = vi.fn().mockRejectedValue(unexpectedError);
    mocks.getAuthService.mockReturnValue({ getAuthenticatedAdmin, });
    const { restoreRequestAdmin, } = await import('../server/utils/auth-session');

    await expect(restoreRequestAdmin(event)).rejects.toBe(unexpectedError);
  });
});
