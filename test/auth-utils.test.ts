import { describe, expect, it } from 'vitest';
import {
  createAccessToken,
  hashPassword,
  hashRefreshToken,
  verifyAccessToken,
  verifyPassword,
} from '../server/utils/auth';

const accessTokenSecret = 'test-access-token-secret-that-is-long-enough';

describe('인증 유틸리티', () => {
  it('Argon2id로 비밀번호를 해시하고 검증한다', async () => {
    const passwordHash = await hashPassword('password123');

    expect(passwordHash).toContain('$argon2id$');
    await expect(verifyPassword(passwordHash, 'password123')).resolves.toBe(true);
    await expect(verifyPassword(passwordHash, 'wrong-password')).resolves.toBe(false);
  });

  it('접근 JWT를 발급하고 인증 정보를 복원한다', async () => {
    const accessToken = await createAccessToken({
      adminId: 1,
      email: 'admin@example.com',
      role: 'ADMIN',
      passwordChangeRequired: true,
    }, accessTokenSecret);

    await expect(verifyAccessToken(accessToken, accessTokenSecret)).resolves.toEqual({
      adminId: 1,
      email: 'admin@example.com',
      role: 'ADMIN',
      passwordChangeRequired: true,
    });
  });

  it('리프레시 토큰은 결정론적 SHA-256 해시로 변환한다', () => {
    expect(hashRefreshToken('refresh-token')).toBe(
      '0eb17643d4e9261163783a420859c92c7d212fa9624106a12b510afbec266120',
    );
  });
});
