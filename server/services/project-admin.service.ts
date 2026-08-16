import type { AdministratorRepository, PermissionRepository, ProjectAdminSummary } from '../types/administrator.types';
import { permissionCodes, type PermissionGrant, type PermissionService } from '../types/permission.types';
import { ApiError } from '../utils/api-error';

export interface ProjectAdminServiceDependencies {
  administrators: AdministratorRepository;
  permissionRepository: PermissionRepository;
  permissionService: PermissionService;
  now(): Date;
}

export interface AssignProjectAdminInput {
  actorAdminId: number;
  projectId: number;
  adminId: number;
  grants: Record<(typeof permissionCodes)[number], PermissionGrant>;
}

async function requireProjectPermission(
  dependencies: ProjectAdminServiceDependencies,
  actorAdminId: number,
  projectId: number,
  permission: 'project_sub_admin.invite' | 'project_sub_admin.update' | 'project_sub_admin.expel',
): Promise<void> {
  if (!await dependencies.permissionService.can({
    adminId: actorAdminId,
    projectId,
    permission,
  })) {
    throw new ApiError(404, 'NOT_FOUND');
  }
}

export function createProjectAdminService(dependencies: ProjectAdminServiceDependencies) {
  return {
    async list(actorAdminId: number, projectId: number): Promise<ProjectAdminSummary[]> {
      await requireProjectPermission(dependencies, actorAdminId, projectId, 'project_sub_admin.update');
      return dependencies.permissionRepository.listProjectAdmins(projectId);
    },

    async listAssignable(actorAdminId: number, projectId: number): Promise<ProjectAdminSummary[]> {
      await requireProjectPermission(dependencies, actorAdminId, projectId, 'project_sub_admin.invite');
      const result = await dependencies.administrators.list({
        page: 0,
        pageSize: 100,
      });
      return result.list.filter(admin => admin.role === 'ADMIN' && admin.useYn === 'Y').map(admin => ({
        adminId: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        accountUseYn: admin.useYn,
        assignmentUseYn: 'N',
        assignedDate: admin.createDate,
      }));
    },

    async assign(input: AssignProjectAdminInput): Promise<void> {
      await requireProjectPermission(dependencies, input.actorAdminId, input.projectId, 'project_sub_admin.invite');
      const target = await dependencies.administrators.findById(input.adminId);
      if (!target || target.delYn === 'Y' || target.useYn !== 'Y' || target.role !== 'ADMIN') {
        throw new ApiError(404, 'NOT_FOUND');
      }
      if (input.adminId === input.actorAdminId) throw new ApiError(400, 'BAD_REQUEST');
      if (permissionCodes.some(code => input.grants[code] !== 'Y' && input.grants[code] !== 'N')) {
        throw new ApiError(400, 'BAD_REQUEST');
      }
      await dependencies.permissionRepository.assignProjectAdmin({
        ...input,
        now: dependencies.now(),
      });
    },

    async remove(actorAdminId: number, projectId: number, adminId: number): Promise<void> {
      await requireProjectPermission(dependencies, actorAdminId, projectId, 'project_sub_admin.expel');
      const assignment = await dependencies.permissionRepository.findProjectAssignment(projectId, adminId);
      if (!assignment || assignment.delYn === 'Y') throw new ApiError(404, 'NOT_FOUND');
      await dependencies.permissionRepository.softDeleteProjectAssignment(projectId, adminId, actorAdminId, dependencies.now());
    },
  };
}

export function createDefaultProjectAdminServiceDependencies(
  administrators: AdministratorRepository,
  permissionRepository: PermissionRepository,
  permissionService: PermissionService,
): ProjectAdminServiceDependencies {
  return {
    administrators,
    permissionRepository,
    permissionService,
    now: () => new Date(),
  };
}
