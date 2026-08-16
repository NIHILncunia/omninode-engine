import { randomBytes } from 'node:crypto';
import type { AdminRole } from '../../app/types/auth.types';
import {
  hasRoleDefaultPermission,
  permissionDefinitions,
  permissionGroups,
} from '../data/permission.data';
import type {
  AdminDetail,
  AdministratorRepository,
  AdminSummary,
  ListResult,
  PermissionRepository,
} from '../types/administrator.types';
import { permissionCodes, type PermissionCode, type PermissionGrant } from '../types/permission.types';
import { ApiError } from '../utils/api-error';
import { hashPassword as hashPasswordValue } from '../utils/auth';

export interface AdminInvitationSender {
  send(input: { email: string; name: string; temporaryPassword: string }): Promise<void>;
}

export interface AdministratorServiceDependencies {
  administrators: AdministratorRepository;
  permissions: PermissionRepository;
  hashPassword(password: string): Promise<string>;
  createTemporaryPassword(): string;
  invitationSender: AdminInvitationSender;
  now(): Date;
}

export interface AdministratorListInput {
  actorAdminId: number;
  page: number;
  pageSize: number;
  search?: string;
}

export interface CreateAdministratorInput {
  actorAdminId: number;
  email: string;
  name: string;
  role: Exclude<AdminRole, 'SUPER_ADMIN'>;
}

export interface UpdateAdministratorInput {
  actorAdminId: number;
  adminId: number;
  name?: string;
  role?: AdminRole;
  useYn?: 'Y' | 'N';
}

export interface UpdatePermissionInput {
  code: PermissionCode;
  grantYn: PermissionGrant;
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
  const ensurePermissionMasters = async (actorAdminId: number) => {
    let masters = await dependencies.permissions.listPermissionMasters();

    if (masters.length !== permissionDefinitions.length) {
      await dependencies.permissions.synchronizePermissionMasters(
        permissionDefinitions,
        actorAdminId,
        dependencies.now(),
      );
      masters = await dependencies.permissions.listPermissionMasters();
    }

    return masters;
  };

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

  const getAdminPermissions = async (actorAdminId: number, adminId: number) => {
    const target = await findVisibleAdmin(actorAdminId, adminId);
    const masters = await ensurePermissionMasters(actorAdminId);
    const overrides = new Map(
      (await dependencies.permissions.listAdminOverrides(adminId)).map(item => [item.code, item.grantYn]),
    );

    return masters.map(master => {
      const definition = permissionDefinitions.find(item => item.code === master.code);
      const defaultGrantYn: PermissionGrant = hasRoleDefaultPermission(target.role, master.code) ? 'Y' : 'N';
      const overrideGrantYn = overrides.get(master.code);
      return {
        code: master.code,
        name: master.name,
        group: definition?.group ?? 'project',
        groupName: permissionGroups[definition?.group ?? 'project'],
        defaultGrantYn,
        overrideGrantYn,
        finalGrantYn: overrideGrantYn ?? defaultGrantYn,
        assignableYn: hasRoleDefaultPermission(target.role, master.code) ? 'Y' as const : 'N' as const,
      };
    });
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

    async create(input: CreateAdministratorInput): Promise<AdminSummary> {
      await requireSuperAdmin(input.actorAdminId);
      const email = input.email.trim().toLowerCase();
      const name = input.name.trim();
      const existing = await dependencies.administrators.findByEmail(email);

      if (existing && existing.delYn === 'N') {
        throw new ApiError(409, 'CONFLICT');
      }

      const temporaryPassword = dependencies.createTemporaryPassword();
      const now = dependencies.now();
      const record = {
        email,
        name,
        role: input.role,
        passwordHash: await dependencies.hashPassword(temporaryPassword),
        actorAdminId: input.actorAdminId,
        now,
      };
      const admin = existing
        ? await dependencies.administrators.restoreByEmail(email, record)
        : await dependencies.administrators.insert(record);

      if (!admin) {
        throw new ApiError(500, 'INTERNAL_SERVER_ERROR');
      }

      await dependencies.invitationSender.send({ email, name, temporaryPassword, });
      return toPublicAdmin(admin);
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

    async listPermissionMasters(actorAdminId: number) {
      await requireSuperAdmin(actorAdminId);
      const masters = await ensurePermissionMasters(actorAdminId);

      return masters.map(master => {
        const definition = permissionDefinitions.find(item => item.code === master.code);
        return {
          ...master,
          name: master.name,
          group: definition?.group ?? 'project',
          groupName: permissionGroups[definition?.group ?? 'project'],
        };
      });
    },

    async getPermissions(actorAdminId: number, adminId: number) {
      return getAdminPermissions(actorAdminId, adminId);
    },

    async updatePermissions(actorAdminId: number, adminId: number, updates: UpdatePermissionInput[]) {
      const target = await findVisibleAdmin(actorAdminId, adminId);
      await ensurePermissionMasters(actorAdminId);
      const uniqueCodes = new Set(updates.map(item => item.code));

      if (uniqueCodes.size !== updates.length) {
        throw new ApiError(400, 'BAD_REQUEST');
      }

      const now = dependencies.now();
      for (const update of updates) {
        if (!permissionCodes.includes(update.code)) {
          throw new ApiError(400, 'BAD_REQUEST');
        }

        if (update.grantYn === 'Y' && !hasRoleDefaultPermission(target.role, update.code)) {
          throw new ApiError(403, 'FORBIDDEN');
        }

        const master = await dependencies.permissions.findPermissionMaster(update.code);
        if (!master) {
          throw new ApiError(400, 'BAD_REQUEST');
        }

        await dependencies.permissions.upsertAdminOverride({
          adminId,
          permissionId: master.id,
          grantYn: update.grantYn,
          actorAdminId,
          now,
        });
      }

      return getAdminPermissions(actorAdminId, adminId);
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
    hashPassword: hashPasswordValue,
    createTemporaryPassword: () => randomBytes(24).toString('base64url'),
    invitationSender: { async send() {}, },
    now: () => new Date(),
  };
}
