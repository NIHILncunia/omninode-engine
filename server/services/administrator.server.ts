import { createDatabaseClient } from '../db/client';
import { createAdministratorRepository } from '../repositories/administrator.repository';
import { createPermissionRepository } from '../repositories/permission.repository';
import { createAdministratorService, createDefaultAdministratorServiceDependencies } from './administrator.service';
import { createPermissionService } from './permission.service';
import { createDefaultProjectAdminServiceDependencies, createProjectAdminService } from './project-admin.service';

export function getAdministratorServices() {
  const runtimeConfig = useRuntimeConfig();
  const database = createDatabaseClient(runtimeConfig.databaseUrl);
  const administrators = createAdministratorRepository(database);
  const permissions = createPermissionRepository(database);
  const permissionService = createPermissionService(permissions);

  return {
    administrators: createAdministratorService(
      createDefaultAdministratorServiceDependencies(administrators, permissions),
    ),
    permissions: permissionService,
    projectAdmins: createProjectAdminService(
      createDefaultProjectAdminServiceDependencies(administrators, permissions, permissionService),
    ),
  };
}
