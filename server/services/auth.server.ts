import { createDatabaseClient } from '../db/client';
import { createAdminRefreshTokenRepository } from '../repositories/admin-refresh-token.repository';
import { createAdminRepository } from '../repositories/admin.repository';
import { createAuthService, createDefaultAuthServiceDependencies } from './auth.service';

export function getAuthService() {
  const runtimeConfig = useRuntimeConfig();

  if (!runtimeConfig.jwtAccessSecret) {
    throw new Error('JWT_ACCESS_SECRET is not set.');
  }

  const database = createDatabaseClient(runtimeConfig.databaseUrl);
  const admins = createAdminRepository(database);
  const refreshTokens = createAdminRefreshTokenRepository(database);

  return createAuthService(createDefaultAuthServiceDependencies(
    admins,
    refreshTokens,
    runtimeConfig.jwtAccessSecret,
  ));
}
