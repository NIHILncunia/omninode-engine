import type { AdminRole } from '../../app/types/auth.types';
import { permissionDefinitions } from '../data/permission.data';
import type { PermissionCode } from '../types/permission.types';
import { ApiError } from '../utils/api-error';

interface PermissionMasterServiceDependencies {
  findActiveAdmin(adminId: number): Promise<{ id: number; role: AdminRole; } | undefined>;
  synchronizePermissionMasters(
    definitions: readonly { code: PermissionCode; name: string; }[],
    actorAdminId: number,
    now: Date,
  ): Promise<void>;
  now(): Date;
}

export function createPermissionMasterService(dependencies: PermissionMasterServiceDependencies) {
  return {
    async seed(actorAdminId: number): Promise<{ count: number; }> {
      const actor = await dependencies.findActiveAdmin(actorAdminId);

      if (actor?.role !== 'SUPER_ADMIN') {
        throw new ApiError(403, 'FORBIDDEN');
      }

      const definitions = permissionDefinitions.map(({ code, name, }) => ({
        code,
        name,
      }));
      await dependencies.synchronizePermissionMasters(definitions, actorAdminId, dependencies.now());

      return { count: definitions.length, };
    },
  };
}
