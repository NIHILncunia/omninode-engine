import { and, count, eq, ilike, ne, or } from 'drizzle-orm';
import type { DatabaseClient } from '../db/client';
import { admins } from '../db/schema/postgresql';
import type {
  AdminDetail,
  AdministratorRepository,
  AdminSummary,
  CreateAdminRecord,
  UpdateAdminRecord,
} from '../types/administrator.types';

function toSummary(row: typeof admins.$inferSelect): AdminSummary {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    useYn: row.useYn,
    passwordChangeRequiredYn: row.passwordChangeRequiredYn,
    lastSignInDate: row.lastSignInDate,
    createDate: row.createDate,
    updateDate: row.updateDate,
  };
}

function toDetail(row: typeof admins.$inferSelect): AdminDetail {
  return {
    ...toSummary(row),
    delYn: row.delYn,
    passwordHash: row.passwordHash,
    passwordChangeRequiredDate: row.passwordChangeRequiredDate,
  };
}

export function createAdministratorRepository(database: DatabaseClient): AdministratorRepository {
  const findById = async (adminId: number): Promise<AdminDetail | undefined> => {
    const [row] = await database.select().from(admins).where(eq(admins.id, adminId)).limit(1);
    return row ? toDetail(row) : undefined;
  };

  return {
    async list(input) {
      const statusCondition = eq(admins.delYn, 'N');
      const searchCondition = input.search
        ? or(ilike(admins.email, `%${input.search}%`), ilike(admins.name, `%${input.search}%`))
        : undefined;
      const whereCondition = searchCondition
        ? and(statusCondition, searchCondition)
        : statusCondition;
      const rows = await database
        .select()
        .from(admins)
        .where(whereCondition)
        .orderBy(admins.id)
        .limit(input.pageSize)
        .offset(input.page * input.pageSize);
      const [total] = await database
        .select({ value: count(), })
        .from(admins)
        .where(whereCondition);

      return {
        list: rows.map(toSummary),
        totalElements: total?.value ?? 0,
      };
    },

    findById,

    async findByEmail(email) {
      const [row] = await database.select().from(admins).where(eq(admins.email, email)).limit(1);
      return row ? toDetail(row) : undefined;
    },

    async insert(input) {
      const [row] = await database.insert(admins).values({
        email: input.email,
        name: input.name,
        role: input.role,
        passwordHash: input.passwordHash,
        passwordChangeRequiredYn: 'Y',
        passwordChangeRequiredDate: input.now,
        createId: input.actorAdminId,
        updateId: input.actorAdminId,
        createDate: input.now,
        updateDate: input.now,
      }).returning();

      if (!row) {
        throw new Error('관리자 생성 결과를 확인할 수 없습니다.');
      }

      return toDetail(row);
    },

    async update(adminId, input) {
      const [row] = await database.update(admins).set({
        ...(input.name !== undefined ? { name: input.name, } : {}),
        ...(input.role !== undefined ? { role: input.role, } : {}),
        ...(input.useYn !== undefined ? { useYn: input.useYn, } : {}),
        updateId: input.actorAdminId,
        updateDate: input.now,
      }).where(and(eq(admins.id, adminId), eq(admins.delYn, 'N'))).returning();

      if (!row) {
        throw new Error('관리자 수정 결과를 확인할 수 없습니다.');
      }

      return toDetail(row);
    },

    async restoreByEmail(email, input) {
      const [row] = await database.update(admins).set({
        name: input.name,
        role: input.role,
        passwordHash: input.passwordHash,
        passwordChangeRequiredYn: 'Y',
        passwordChangeRequiredDate: input.now,
        useYn: 'Y',
        delYn: 'N',
        deleteId: null,
        deleteDate: null,
        updateId: input.actorAdminId,
        updateDate: input.now,
      }).where(and(eq(admins.email, email), eq(admins.delYn, 'Y'))).returning();

      return row ? toDetail(row) : undefined;
    },

    async softDelete(adminId, actorAdminId, now) {
      await database.update(admins).set({
        useYn: 'N',
        delYn: 'Y',
        deleteId: actorAdminId,
        deleteDate: now,
        updateId: actorAdminId,
        updateDate: now,
      }).where(and(eq(admins.id, adminId), eq(admins.delYn, 'N')));
    },

    async countActiveSuperAdmins(excludeAdminId) {
      const conditions = [
        eq(admins.role, 'SUPER_ADMIN'),
        eq(admins.useYn, 'Y'),
        eq(admins.delYn, 'N'),
      ];

      if (excludeAdminId !== undefined) {
        conditions.push(ne(admins.id, excludeAdminId));
      }

      const [result] = await database.select({ value: count(), }).from(admins).where(and(...conditions));
      return result?.value ?? 0;
    },

    async resetTemporaryPassword(adminId, passwordHash, actorAdminId, now) {
      await database.update(admins).set({
        passwordHash,
        passwordChangeRequiredYn: 'Y',
        passwordChangeRequiredDate: now,
        useYn: 'Y',
        updateId: actorAdminId,
        updateDate: now,
      }).where(and(eq(admins.id, adminId), eq(admins.delYn, 'N')));
    },
  };
}
