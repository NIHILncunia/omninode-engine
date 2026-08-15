import { randomBytes } from 'node:crypto';
import type { AuthenticatedAdmin } from '../../app/types/auth.types';
import type { AccessTokenPayload } from '../types/auth.types';
import {
  createAccessToken as createAccessTokenValue,
  hashPassword as hashPasswordValue,
  hashRefreshToken as hashRefreshTokenValue,
  verifyAccessToken as verifyAccessTokenValue,
  verifyPassword as verifyPasswordValue,
} from '../utils/auth';
import { ApiError } from '../utils/api-error';

const refreshTokenDurationMilliseconds = 14 * 24 * 60 * 60 * 1000;

export interface AdminAuthenticationRecord extends AuthenticatedAdmin {
  passwordHash: string;
  passwordChangeRequiredYn: 'Y' | 'N';
  useYn: 'Y' | 'N';
  delYn: 'Y' | 'N';
}

export interface RefreshTokenRecord {
  id: number;
  adminId: number;
  expiresDate: Date;
}

export interface AdminRepository {
  findByEmail(email: string): Promise<AdminAuthenticationRecord | undefined>;
  findById(id: number): Promise<AdminAuthenticationRecord | undefined>;
  updateLastSignInDate(id: number, lastSignInDate: Date): Promise<void>;
  updatePassword(id: number, passwordHash: string, changedAt: Date): Promise<void>;
}

export interface AdminRefreshTokenRepository {
  create(input: CreateRefreshTokenInput): Promise<void>;
  findActiveByTokenHash(tokenHash: string, now: Date): Promise<RefreshTokenRecord | undefined>;
  rotate(input: RotateRefreshTokenInput): Promise<boolean>;
  revokeByTokenHash(tokenHash: string, revokedAt: Date): Promise<void>;
  revokeAllByAdminId(adminId: number, revokedAt: Date): Promise<void>;
}

export interface CreateRefreshTokenInput {
  adminId: number;
  tokenHash: string;
  expiresDate: Date;
  deviceInfo?: string;
}

export interface RotateRefreshTokenInput extends CreateRefreshTokenInput {
  previousTokenId: number;
}

export interface AuthServiceDependencies {
  admins: AdminRepository;
  refreshTokens: AdminRefreshTokenRepository;
  createAccessToken: (payload: AccessTokenPayload) => Promise<string>;
  createRefreshToken: () => string;
  hashRefreshToken: (refreshToken: string) => string;
  hashPassword: (password: string) => Promise<string>;
  verifyPassword: (passwordHash: string, password: string) => Promise<boolean>;
  verifyAccessToken: (accessToken: string) => Promise<AccessTokenPayload>;
  now: () => Date;
}

export interface SigninInput {
  email: string;
  password: string;
  deviceInfo?: string;
}

export interface RefreshInput {
  refreshToken: string;
  deviceInfo?: string;
}

export interface ChangePasswordInput {
  adminId: number;
  currentPassword: string;
  newPassword: string;
  deviceInfo?: string;
}

export interface AuthSession {
  admin: AuthenticatedAdmin;
  accessToken: string;
  refreshToken: string;
}

function createUnauthorizedError(): ApiError {
  return new ApiError(401, 'UNAUTHORIZED');
}

function isActiveAdmin(admin: AdminAuthenticationRecord | undefined): admin is AdminAuthenticationRecord {
  return admin !== undefined && admin.useYn === 'Y' && admin.delYn === 'N';
}

function toAuthenticatedAdmin(admin: AdminAuthenticationRecord): AuthenticatedAdmin {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    passwordChangeRequired: admin.passwordChangeRequiredYn === 'Y',
  };
}

export function createAuthService(dependencies: AuthServiceDependencies) {
  const issueSession = async (
    admin: AdminAuthenticationRecord,
    deviceInfo: string | undefined,
    previousTokenId?: number,
  ): Promise<AuthSession> => {
    const authenticatedAdmin = toAuthenticatedAdmin(admin);
    const now = dependencies.now();
    const refreshToken = dependencies.createRefreshToken();
    const refreshTokenInput: CreateRefreshTokenInput = {
      adminId: admin.id,
      tokenHash: dependencies.hashRefreshToken(refreshToken),
      expiresDate: new Date(now.getTime() + refreshTokenDurationMilliseconds),
      deviceInfo,
    };
    const accessToken = await dependencies.createAccessToken({
      adminId: authenticatedAdmin.id,
      email: authenticatedAdmin.email,
      role: authenticatedAdmin.role,
      passwordChangeRequired: authenticatedAdmin.passwordChangeRequired,
    });

    if (previousTokenId === undefined) {
      await dependencies.refreshTokens.create(refreshTokenInput);
    } else {
      const rotated = await dependencies.refreshTokens.rotate({
        ...refreshTokenInput,
        previousTokenId,
      });

      if (!rotated) {
        throw createUnauthorizedError();
      }
    }

    return {
      admin: authenticatedAdmin,
      accessToken,
      refreshToken,
    };
  };

  return {
    async signin(input: SigninInput): Promise<AuthSession> {
      const admin = await dependencies.admins.findByEmail(input.email);

      if (!isActiveAdmin(admin) || !await dependencies.verifyPassword(admin.passwordHash, input.password)) {
        throw createUnauthorizedError();
      }

      const session = await issueSession(admin, input.deviceInfo);
      await dependencies.admins.updateLastSignInDate(admin.id, dependencies.now());

      return session;
    },

    async refresh(input: RefreshInput): Promise<AuthSession> {
      const now = dependencies.now();
      const refreshToken = await dependencies.refreshTokens.findActiveByTokenHash(
        dependencies.hashRefreshToken(input.refreshToken),
        now,
      );

      if (!refreshToken) {
        throw createUnauthorizedError();
      }

      const admin = await dependencies.admins.findById(refreshToken.adminId);
      if (!isActiveAdmin(admin)) {
        throw createUnauthorizedError();
      }

      return issueSession(admin, input.deviceInfo, refreshToken.id);
    },

    async signout(refreshToken: string): Promise<void> {
      await dependencies.refreshTokens.revokeByTokenHash(
        dependencies.hashRefreshToken(refreshToken),
        dependencies.now(),
      );
    },

    async getAuthenticatedAdmin(accessToken: string): Promise<AuthenticatedAdmin> {
      let payload: AccessTokenPayload;

      try {
        payload = await dependencies.verifyAccessToken(accessToken);
      } catch {
        throw createUnauthorizedError();
      }

      const admin = await dependencies.admins.findById(payload.adminId);
      if (!isActiveAdmin(admin)) {
        throw createUnauthorizedError();
      }

      return toAuthenticatedAdmin(admin);
    },

    async changePassword(input: ChangePasswordInput): Promise<AuthSession> {
      if (input.newPassword.length < 8) {
        throw new ApiError(400, 'BAD_REQUEST');
      }

      const admin = await dependencies.admins.findById(input.adminId);
      if (!isActiveAdmin(admin) || !await dependencies.verifyPassword(admin.passwordHash, input.currentPassword)) {
        throw createUnauthorizedError();
      }

      const now = dependencies.now();
      const passwordHash = await dependencies.hashPassword(input.newPassword);
      await dependencies.admins.updatePassword(admin.id, passwordHash, now);
      await dependencies.refreshTokens.revokeAllByAdminId(admin.id, now);

      return issueSession({
        ...admin,
        passwordHash,
        passwordChangeRequiredYn: 'N',
      }, input.deviceInfo);
    },
  };
}

export function createDefaultAuthServiceDependencies(
  admins: AdminRepository,
  refreshTokens: AdminRefreshTokenRepository,
  accessTokenSecret: string,
): AuthServiceDependencies {
  return {
    admins,
    refreshTokens,
    createAccessToken: payload => createAccessTokenValue(payload, accessTokenSecret),
    createRefreshToken: () => randomBytes(48).toString('base64url'),
    hashRefreshToken: hashRefreshTokenValue,
    hashPassword: hashPasswordValue,
    verifyPassword: verifyPasswordValue,
    verifyAccessToken: accessToken => verifyAccessTokenValue(accessToken, accessTokenSecret),
    now: () => new Date(),
  };
}
