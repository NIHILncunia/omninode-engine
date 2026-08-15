import { createHash } from 'node:crypto';
import argon2 from 'argon2';
import { jwtVerify, SignJWT } from 'jose';
import { adminRoles, type AdminRole } from '../../app/types/auth.types';
import type { AccessTokenPayload } from '../types/auth.types';

const accessTokenIssuer = 'omninode';
const accessTokenExpiration = '15m';

function toSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && adminRoles.includes(value as AdminRole);
}

function toAccessTokenPayload(payload: Record<string, unknown>): AccessTokenPayload {
  const adminId = Number(payload.sub);

  if (
    !Number.isSafeInteger(adminId)
    || adminId < 1
    || typeof payload.email !== 'string'
    || !isAdminRole(payload.role)
    || typeof payload.passwordChangeRequired !== 'boolean'
  ) {
    throw new Error('접근 토큰 형식이 올바르지 않습니다.');
  }

  return {
    adminId,
    email: payload.email,
    role: payload.role,
    passwordChangeRequired: payload.passwordChangeRequired,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
  });
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return argon2.verify(passwordHash, password);
}

export async function createAccessToken(
  payload: AccessTokenPayload,
  secret: string,
): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    passwordChangeRequired: payload.passwordChangeRequired,
  })
    .setProtectedHeader({ alg: 'HS256', })
    .setIssuer(accessTokenIssuer)
    .setSubject(String(payload.adminId))
    .setIssuedAt()
    .setExpirationTime(accessTokenExpiration)
    .sign(toSecretKey(secret));
}

export async function verifyAccessToken(
  accessToken: string,
  secret: string,
): Promise<AccessTokenPayload> {
  const { payload, } = await jwtVerify(accessToken, toSecretKey(secret), {
    issuer: accessTokenIssuer,
  });

  return toAccessTokenPayload(payload);
}

export function hashRefreshToken(refreshToken: string): string {
  return createHash('sha256').update(refreshToken).digest('hex');
}
