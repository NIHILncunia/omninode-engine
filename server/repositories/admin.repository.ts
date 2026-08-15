import { eq, type InferSelectModel } from 'drizzle-orm';
import type { DatabaseClient } from '../db/client';
import { admins } from '../db/schema/postgresql';
import type { AdminAuthenticationRecord, AdminRepository } from '../services/auth.service';

type AdminRow = InferSelectModel<typeof admins>;

function toAuthenticationRecord(admin: AdminRow): AdminAuthenticationRecord {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    passwordHash: admin.passwordHash,
    passwordChangeRequiredYn: admin.passwordChangeRequiredYn,
    useYn: admin.useYn,
    delYn: admin.delYn,
  };
}

export function createAdminRepository(database: DatabaseClient): AdminRepository {
  return {
    async findByEmail(email: string) {
      const [
        admin,
      ] = await database
        .select()
        .from(admins)
        .where(eq(admins.email, email))
        .limit(1);

      return admin ? toAuthenticationRecord(admin) : undefined;
    },

    async findById(id: number) {
      const [
        admin,
      ] = await database
        .select()
        .from(admins)
        .where(eq(admins.id, id))
        .limit(1);

      return admin ? toAuthenticationRecord(admin) : undefined;
    },

    async updateLastSignInDate(id: number, lastSignInDate: Date) {
      await database
        .update(admins)
        .set({
          lastSignInDate,
          updateDate: lastSignInDate,
        })
        .where(eq(admins.id, id));
    },

    async updatePassword(id: number, passwordHash: string, changedAt: Date) {
      await database
        .update(admins)
        .set({
          passwordHash,
          passwordChangeRequiredYn: 'N',
          passwordChangeRequiredDate: changedAt,
          updateDate: changedAt,
        })
        .where(eq(admins.id, id));
    },
  };
}
