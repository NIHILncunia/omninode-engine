import { createDatabaseClient } from '../db/client';
import { createAdminPermissionRequestRepository } from '../repositories/admin-permission-request.repository';
import { createAdministratorRepository } from '../repositories/administrator.repository';
import { createPermissionRepository } from '../repositories/permission.repository';
import { createAdministratorService, createDefaultAdministratorServiceDependencies } from './administrator.service';
import { createPermissionService } from './permission.service';
import { createAdminPermissionRequestService } from './admin-permission-request.service';
import { createDefaultProjectAdminServiceDependencies, createProjectAdminService } from './project-admin.service';
import { createAdminCredentialMailer } from '../utils/admin-credential-mailer';
import { hashPassword } from '../utils/auth';
import { randomBytes } from 'node:crypto';

export function getAdministratorServices() {
  const runtimeConfig = useRuntimeConfig();
  const database = createDatabaseClient(runtimeConfig.databaseUrl);
  const administrators = createAdministratorRepository(database);
  const permissions = createPermissionRepository(database);
  const permissionRequests = createAdminPermissionRequestRepository(database);
  const permissionService = createPermissionService(permissions);

  return {
    administrators: createAdministratorService(
      createDefaultAdministratorServiceDependencies(administrators, permissions),
    ),
    permissions: permissionService,
    projectAdmins: createProjectAdminService(
      createDefaultProjectAdminServiceDependencies(administrators, permissions, permissionService),
    ),
    permissionRequests: createAdminPermissionRequestService({
      requests: permissionRequests,
      administrators,
      findActiveAdmin: permissions.findActiveAdmin,
      hashPassword,
      createTemporaryPassword: () => randomBytes(24).toString('base64url'),
      mailer: createAdminCredentialMailer({
        host: runtimeConfig.smtpHost,
        port: runtimeConfig.smtpPort,
        secure: runtimeConfig.smtpSecure,
        user: runtimeConfig.smtpUser,
        password: runtimeConfig.smtpPassword,
        from: runtimeConfig.smtpFrom,
      }),
      now: () => new Date(),
    }),
  };
}
