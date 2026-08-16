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
  const canUsePermission = async (input: PermissionDecisionInput): Promise<boolean> => {
    const admin = await dependencies.findActiveAdmin(input.adminId);

    if (!admin) {
      return false;
    }

    if (admin.role === 'SUPER_ADMIN') {
      return true;
    }

    if (input.permission === 'project.create' && input.projectId === undefined) {
      return admin.role === 'ADMIN';
    }

    if (input.projectId === undefined) return false;
    if (!await dependencies.hasActiveProjectAssignment(input.projectId, input.adminId)) return false;
    return (await dependencies.findActiveProjectPermission(input.projectId, input.adminId, input.permission)) === 'Y';
  };

  const requirePermission = async (input: PermissionDecisionInput): Promise<void> => {
    if (!await canUsePermission(input)) {
      throw new ApiError(403, 'FORBIDDEN');
    }
  };

  return {
    can: canUsePermission,
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
