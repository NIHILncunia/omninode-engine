import { hasRoleDefaultPermission } from '../data/permission.data';
import type {
  PermissionAssignmentInput,
  PermissionDecisionInput,
  PermissionService,
  PermissionServiceDependencies,
} from '../types/permission.types';
import { ApiError } from '../utils/api-error';

export function createPermissionService(
  dependencies: PermissionServiceDependencies,
): PermissionService {
  const canUseRolePermission = async (input: PermissionDecisionInput): Promise<boolean> => {
    const admin = await dependencies.findActiveAdmin(input.adminId);

    if (!admin || !hasRoleDefaultPermission(admin.role, input.permission)) {
      return false;
    }

    const override = await dependencies.findActiveOverride(input.adminId, input.permission);

    if (override === 'N') {
      return false;
    }

    if (input.projectId === undefined) {
      return input.permission === 'project.create'
        ? admin.role === 'SUPER_ADMIN' || admin.role === 'ADMIN'
        : admin.role === 'SUPER_ADMIN';
    }

    if (admin.role === 'SUPER_ADMIN') {
      return true;
    }

    if (admin.role === 'ADMIN') {
      return dependencies.isProjectOwner(input.projectId, input.adminId);
    }

    return dependencies.isAssignedProjectAdmin(input.projectId, input.adminId);
  };

  const requirePermission = async (input: PermissionDecisionInput): Promise<void> => {
    if (!await canUseRolePermission(input)) {
      throw new ApiError(403, 'FORBIDDEN');
    }
  };

  return {
    can: canUseRolePermission,
    require: requirePermission,

    async assertAssignable(input: PermissionAssignmentInput): Promise<void> {
      if (input.actorAdminId === input.targetAdminId) {
        throw new ApiError(400, 'BAD_REQUEST');
      }

      await requirePermission({
        adminId: input.actorAdminId,
        permission: input.permission,
        projectId: input.projectId,
      });
    },
  };
}
