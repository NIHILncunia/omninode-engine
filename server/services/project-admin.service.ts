import { randomBytes } from 'node:crypto';
import type {
  AdministratorRepository,
  PermissionRepository,
  ProjectAdminSummary,
} from '../types/administrator.types';
import type { PermissionService } from '../types/permission.types';
import { ApiError } from '../utils/api-error';
import { hashPassword as hashPasswordValue } from '../utils/auth';
import type { AdminInvitationSender } from './administrator.service';

export interface ProjectAdminServiceDependencies {
  administrators: AdministratorRepository;
  permissionRepository: PermissionRepository;
  permissionService: PermissionService;
  hashPassword(password: string): Promise<string>;
  createTemporaryPassword(): string;
  invitationSender: AdminInvitationSender;
  now(): Date;
}

export interface InviteProjectAdminInput {
  actorAdminId: number;
  projectId: number;
  email: string;
  name?: string;
}

async function requireProjectPermission(
  dependencies: ProjectAdminServiceDependencies,
  actorAdminId: number,
  projectId: number,
  permission: 'project_sub_admin.invite' | 'project_sub_admin.update' | 'project_sub_admin.expel',
): Promise<void> {
  if (!await dependencies.permissionService.can({ adminId: actorAdminId, projectId, permission, })) {
    throw new ApiError(404, 'NOT_FOUND');
  }
}

export function createProjectAdminService(dependencies: ProjectAdminServiceDependencies) {
  return {
    async list(actorAdminId: number, projectId: number): Promise<ProjectAdminSummary[]> {
      await requireProjectPermission(dependencies, actorAdminId, projectId, 'project_sub_admin.update');
      return dependencies.permissionRepository.listProjectAdmins(projectId);
    },

    async invite(input: InviteProjectAdminInput): Promise<ProjectAdminSummary> {
      await requireProjectPermission(
        dependencies,
        input.actorAdminId,
        input.projectId,
        'project_sub_admin.invite',
      );
      const email = input.email.trim().toLowerCase();
      const temporaryPassword = dependencies.createTemporaryPassword();
      const passwordHash = await dependencies.hashPassword(temporaryPassword);
      const now = dependencies.now();
      let target = await dependencies.administrators.findByEmail(email);

      if (!target) {
        const name = input.name?.trim();
        if (!name) {
          throw new ApiError(400, 'BAD_REQUEST');
        }

        target = await dependencies.administrators.insert({
          email,
          name,
          role: 'SUB_ADMIN',
          passwordHash,
          actorAdminId: input.actorAdminId,
          now,
        });
      } else if (target.delYn === 'Y') {
        target = await dependencies.administrators.restoreByEmail(email, {
          email,
          name: input.name?.trim() || target.name,
          role: 'SUB_ADMIN',
          passwordHash,
          actorAdminId: input.actorAdminId,
          now,
        });
      } else if (target.role !== 'SUB_ADMIN') {
        throw new ApiError(400, 'BAD_REQUEST');
      } else {
        await dependencies.administrators.resetTemporaryPassword(
          target.id,
          passwordHash,
          input.actorAdminId,
          now,
        );
      }

      if (!target || target.role !== 'SUB_ADMIN') {
        throw new ApiError(500, 'INTERNAL_SERVER_ERROR');
      }

      await dependencies.permissionService.assertAssignable({
        actorAdminId: input.actorAdminId,
        targetAdminId: target.id,
        projectId: input.projectId,
        permission: 'project_sub_admin.invite',
      });
      await dependencies.permissionRepository.upsertProjectAssignment(
        input.projectId,
        target.id,
        input.actorAdminId,
        now,
      );
      await dependencies.invitationSender.send({
        email: target.email,
        name: target.name,
        temporaryPassword,
      });

      const admins = await dependencies.permissionRepository.listProjectAdmins(input.projectId);
      const invited = admins.find(admin => admin.adminId === target?.id);
      if (!invited) {
        throw new ApiError(500, 'INTERNAL_SERVER_ERROR');
      }

      return invited;
    },

    async update(
      actorAdminId: number,
      projectId: number,
      adminId: number,
      useYn: 'Y' | 'N',
    ): Promise<void> {
      await requireProjectPermission(dependencies, actorAdminId, projectId, 'project_sub_admin.update');
      const assignment = await dependencies.permissionRepository.findProjectAssignment(projectId, adminId);

      if (!assignment || assignment.delYn === 'Y') {
        throw new ApiError(404, 'NOT_FOUND');
      }

      await dependencies.permissionRepository.updateProjectAssignment(
        projectId,
        adminId,
        useYn,
        actorAdminId,
        dependencies.now(),
      );
    },

    async remove(actorAdminId: number, projectId: number, adminId: number): Promise<void> {
      await requireProjectPermission(dependencies, actorAdminId, projectId, 'project_sub_admin.expel');
      const assignment = await dependencies.permissionRepository.findProjectAssignment(projectId, adminId);

      if (!assignment || assignment.delYn === 'Y') {
        throw new ApiError(404, 'NOT_FOUND');
      }

      await dependencies.permissionRepository.softDeleteProjectAssignment(
        projectId,
        adminId,
        actorAdminId,
        dependencies.now(),
      );
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
    hashPassword: hashPasswordValue,
    createTemporaryPassword: () => randomBytes(24).toString('base64url'),
    invitationSender: { async send() {}, },
    now: () => new Date(),
  };
}
