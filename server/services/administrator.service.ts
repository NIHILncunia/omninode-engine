import type { AdminRole } from '../../app/types/auth.types';
import type {
  AdminDetail,
  AdministratorRepository,
  AdminSummary,
  ListResult,
  PermissionRepository,
} from '../types/administrator.types';
import { ApiError } from '../utils/api-error';

export interface AdministratorServiceDependencies {
  administrators: AdministratorRepository;
  permissions: PermissionRepository;
  now(): Date;
}

export interface AdministratorListInput {
  actorAdminId: number;
  page: number;
  pageSize: number;
  search?: string;
}

export interface UpdateAdministratorInput {
  actorAdminId: number;
  adminId: number;
  name?: string;
  role?: AdminRole;
  useYn?: 'Y' | 'N';
}

function toPublicAdmin(admin: AdminDetail): AdminSummary {
  const {
    passwordHash: _passwordHash,
    passwordChangeRequiredDate: _passwordChangeRequiredDate,
    delYn: _delYn,
    ...summary
  } = admin;

  return summary;
}

export function createAdministratorService(dependencies: AdministratorServiceDependencies) {
  const requireSuperAdmin = async (actorAdminId: number): Promise<void> => {
    const actor = await dependencies.permissions.findActiveAdmin(actorAdminId);

    if (actor?.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'FORBIDDEN');
    }
  };

  const findVisibleAdmin = async (actorAdminId: number, adminId: number): Promise<AdminDetail> => {
    await requireSuperAdmin(actorAdminId);
    const admin = await dependencies.administrators.findById(adminId);

    if (!admin || admin.delYn === 'Y') {
      throw new ApiError(404, 'NOT_FOUND');
    }

    return admin;
  };

  const ensureSuperAdminRemains = async (
    target: AdminDetail,
    nextRole: AdminRole,
    nextUseYn: 'Y' | 'N',
  ): Promise<void> => {
    if (
      target.role === 'SUPER_ADMIN'
      && target.useYn === 'Y'
      && (nextRole !== 'SUPER_ADMIN' || nextUseYn === 'N')
      && await dependencies.administrators.countActiveSuperAdmins(target.id) < 1
    ) {
      throw new ApiError(409, 'CONFLICT');
    }
  };

  return {
    async list(input: AdministratorListInput): Promise<ListResult<AdminSummary>> {
      await requireSuperAdmin(input.actorAdminId);
      return dependencies.administrators.list({
        page: input.page,
        pageSize: input.pageSize,
        search: input.search,
      });
    },

    async get(actorAdminId: number, adminId: number): Promise<AdminSummary> {
      return toPublicAdmin(await findVisibleAdmin(actorAdminId, adminId));
    },

    async update(input: UpdateAdministratorInput): Promise<AdminSummary> {
      const target = await findVisibleAdmin(input.actorAdminId, input.adminId);

      if (input.adminId === input.actorAdminId && input.useYn === 'N') {
        throw new ApiError(409, 'CONFLICT');
      }

      const nextRole = input.role ?? target.role;
      const nextUseYn = input.useYn ?? target.useYn;
      await ensureSuperAdminRemains(target, nextRole, nextUseYn);
      const updated = await dependencies.administrators.update(input.adminId, {
        ...(input.name !== undefined ? { name: input.name.trim(), } : {}),
        ...(input.role !== undefined ? { role: input.role, } : {}),
        ...(input.useYn !== undefined ? { useYn: input.useYn, } : {}),
        actorAdminId: input.actorAdminId,
        now: dependencies.now(),
      });
      return toPublicAdmin(updated);
    },

    async remove(actorAdminId: number, adminId: number): Promise<void> {
      const target = await findVisibleAdmin(actorAdminId, adminId);

      if (actorAdminId === adminId) {
        throw new ApiError(409, 'CONFLICT');
      }

      await ensureSuperAdminRemains(target, target.role, 'N');
      await dependencies.administrators.softDelete(adminId, actorAdminId, dependencies.now());
    },

  };
}

export function createDefaultAdministratorServiceDependencies(
  administrators: AdministratorRepository,
  permissions: PermissionRepository,
): AdministratorServiceDependencies {
  return {
    administrators,
    permissions,
    now: () => new Date(),
  };
}
