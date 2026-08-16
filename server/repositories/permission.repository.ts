import { and, eq } from 'drizzle-orm';
import type { DatabaseClient } from '../db/client';
import {
  adminPermissions,
  admins,
  permissions,
  projectAdmins,
} from '../db/schema/postgresql';
import type { PermissionRepository } from '../types/administrator.types';
import type { PermissionCode } from '../types/permission.types';

export function createPermissionRepository(database: DatabaseClient): PermissionRepository {
  return {
    async synchronizePermissionMasters(definitions, actorAdminId, now) {
      for (const definition of definitions) {
        await database.insert(permissions).values({
          code: definition.code,
          name: definition.name,
          useYn: 'Y',
          delYn: 'N',
          createId: actorAdminId,
          updateId: actorAdminId,
          createDate: now,
          updateDate: now,
        }).onConflictDoUpdate({
          target: permissions.code,
          set: {
            name: definition.name,
            useYn: 'Y',
            delYn: 'N',
            deleteId: null,
            deleteDate: null,
            updateId: actorAdminId,
            updateDate: now,
          },
        });
      }
    },

    async findActiveAdmin(adminId) {
      const [row] = await database.select({ id: admins.id, role: admins.role, }).from(admins).where(and(
        eq(admins.id, adminId),
        eq(admins.useYn, 'Y'),
        eq(admins.delYn, 'N'),
      )).limit(1);
      return row;
    },

    async findActiveProjectPermission(projectId, adminId, code) {
      const [row] = await database.select({ grantYn: adminPermissions.grantYn, })
        .from(adminPermissions)
        .innerJoin(permissions, eq(adminPermissions.permissionId, permissions.id))
        .where(and(
          eq(adminPermissions.projectId, projectId),
          eq(adminPermissions.adminId, adminId),
          eq(adminPermissions.useYn, 'Y'),
          eq(adminPermissions.delYn, 'N'),
          eq(permissions.code, code),
          eq(permissions.useYn, 'Y'),
          eq(permissions.delYn, 'N'),
        )).limit(1);
      return row?.grantYn;
    },

    async listPermissionMasters() {
      const rows = await database.select({
        id: permissions.id,
        code: permissions.code,
        name: permissions.name,
      }).from(permissions).where(and(eq(permissions.useYn, 'Y'), eq(permissions.delYn, 'N'))).orderBy(permissions.id);

      return rows.map(row => ({ ...row, code: row.code as PermissionCode, }));
    },

    async findPermissionMaster(code) {
      const [row] = await database.select({
        id: permissions.id,
        code: permissions.code,
        name: permissions.name,
      }).from(permissions).where(and(
        eq(permissions.code, code),
        eq(permissions.useYn, 'Y'),
        eq(permissions.delYn, 'N'),
      )).limit(1);
      return row ? { ...row, code: row.code as PermissionCode, } : undefined;
    },

    async listProjectAdmins(projectId) {
      const rows = await database.select({
        adminId: admins.id,
        email: admins.email,
        name: admins.name,
        role: admins.role,
        accountUseYn: admins.useYn,
        assignmentUseYn: projectAdmins.useYn,
        assignedDate: projectAdmins.createDate,
      }).from(projectAdmins)
        .innerJoin(admins, eq(projectAdmins.adminId, admins.id))
        .where(and(eq(projectAdmins.projectId, projectId), eq(projectAdmins.delYn, 'N')))
        .orderBy(projectAdmins.id);
      return rows;
    },

    async findProjectAssignment(projectId, adminId) {
      const [row] = await database.select({ delYn: projectAdmins.delYn, }).from(projectAdmins).where(and(
        eq(projectAdmins.projectId, projectId),
        eq(projectAdmins.adminId, adminId),
      )).limit(1);
      return row;
    },

    async upsertProjectAssignment(projectId, adminId, actorAdminId, now) {
      await database.insert(projectAdmins).values({
        projectId,
        adminId,
        useYn: 'Y',
        delYn: 'N',
        createId: actorAdminId,
        updateId: actorAdminId,
        createDate: now,
        updateDate: now,
      }).onConflictDoUpdate({
        target: [projectAdmins.projectId, projectAdmins.adminId],
        set: {
          useYn: 'Y',
          delYn: 'N',
          deleteId: null,
          deleteDate: null,
          updateId: actorAdminId,
          updateDate: now,
        },
      });
    },

    async updateProjectAssignment(projectId, adminId, useYn, actorAdminId, now) {
      await database.update(projectAdmins).set({
        useYn,
        updateId: actorAdminId,
        updateDate: now,
      }).where(and(
        eq(projectAdmins.projectId, projectId),
        eq(projectAdmins.adminId, adminId),
        eq(projectAdmins.delYn, 'N'),
      ));
    },

    async softDeleteProjectAssignment(projectId, adminId, actorAdminId, now) {
      await database.update(projectAdmins).set({
        useYn: 'N',
        delYn: 'Y',
        deleteId: actorAdminId,
        deleteDate: now,
        updateId: actorAdminId,
        updateDate: now,
      }).where(and(
        eq(projectAdmins.projectId, projectId),
        eq(projectAdmins.adminId, adminId),
        eq(projectAdmins.delYn, 'N'),
      ));
    },

    async assignProjectAdmin(input) {
      await database.transaction(async transaction => {
        await transaction.insert(projectAdmins).values({
          projectId: input.projectId,
          adminId: input.adminId,
          useYn: 'Y',
          delYn: 'N',
          createId: input.actorAdminId,
          updateId: input.actorAdminId,
          createDate: input.now,
          updateDate: input.now,
        }).onConflictDoUpdate({
          target: [projectAdmins.projectId, projectAdmins.adminId],
          set: { useYn: 'Y', delYn: 'N', deleteId: null, deleteDate: null, updateId: input.actorAdminId, updateDate: input.now, },
        });
        const masters = await transaction.select().from(permissions).where(and(eq(permissions.useYn, 'Y'), eq(permissions.delYn, 'N')));
        if (masters.length !== 18) throw new Error('권한 마스터가 완전하지 않습니다.');
        for (const master of masters) {
          const grantYn = input.grants[master.code as PermissionCode];
          if (!grantYn) throw new Error('권한 설정이 완전하지 않습니다.');
          await transaction.insert(adminPermissions).values({
            projectId: input.projectId,
            adminId: input.adminId,
            permissionId: master.id,
            grantYn,
            useYn: 'Y',
            delYn: 'N',
            createId: input.actorAdminId,
            updateId: input.actorAdminId,
            createDate: input.now,
            updateDate: input.now,
          }).onConflictDoUpdate({
            target: [adminPermissions.projectId, adminPermissions.adminId, adminPermissions.permissionId],
            set: { grantYn, useYn: 'Y', delYn: 'N', deleteId: null, deleteDate: null, updateId: input.actorAdminId, updateDate: input.now, },
          });
        }
      });
    },
  };
}
