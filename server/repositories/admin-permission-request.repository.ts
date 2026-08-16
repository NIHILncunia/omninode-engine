import { and, desc, eq } from 'drizzle-orm';
import type { DatabaseClient } from '../db/client';
import { adminPermissionRequests, admins } from '../db/schema/postgresql';
import type {
  AdminPermissionRequestRecord,
  AdminPermissionRequestRepository,
} from '../types/admin-permission-request.types';

function toRecord(row: typeof adminPermissionRequests.$inferSelect): AdminPermissionRequestRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status,
    reviewedByAdminId: row.reviewedByAdminId,
    reviewedDate: row.reviewedDate,
    rejectionReason: row.rejectionReason,
    credentialDeliveredDate: row.credentialDeliveredDate,
    credentialDeliveryFailedDate: row.credentialDeliveryFailedDate,
  };
}

export function createAdminPermissionRequestRepository(database: DatabaseClient): AdminPermissionRequestRepository {
  const findById = async (requestId: number): Promise<AdminPermissionRequestRecord | undefined> => {
    const [
      row,
    ] = await database.select().from(adminPermissionRequests).where(and(
      eq(adminPermissionRequests.id, requestId),
      eq(adminPermissionRequests.delYn, 'N'),
    )).limit(1);
    return row ? toRecord(row) : undefined;
  };

  return {
    async list() {
      const rows = await database.select().from(adminPermissionRequests).where(eq(
        adminPermissionRequests.delYn,
        'N',
      )).orderBy(desc(adminPermissionRequests.id));
      return rows.map(toRecord);
    },

    async findPendingByEmail(email) {
      const [
        row,
      ] = await database.select().from(adminPermissionRequests).where(and(
        eq(adminPermissionRequests.email, email),
        eq(adminPermissionRequests.status, 'PENDING'),
        eq(adminPermissionRequests.delYn, 'N'),
      )).limit(1);
      return row ? toRecord(row) : undefined;
    },

    findById,

    async insert(input) {
      const [
        row,
      ] = await database.insert(adminPermissionRequests).values({
        email: input.email,
        name: input.name,
        status: 'PENDING',
        createDate: input.now,
        updateDate: input.now,
      }).returning();
      if (!row) throw new Error('관리자 권한 요청 생성 결과를 확인할 수 없습니다.');
      return toRecord(row);
    },

    async approveAndProvisionAdmin(input) {
      return database.transaction(async transaction => {
        const [
          request,
        ] = await transaction.select().from(adminPermissionRequests).where(and(
          eq(adminPermissionRequests.id, input.requestId),
          eq(adminPermissionRequests.status, 'PENDING'),
          eq(adminPermissionRequests.delYn, 'N'),
        )).for('update').limit(1);

        if (!request) {
          return { status: 'REQUEST_NOT_PENDING' as const, };
        }

        const [
          existingAdmin,
        ] = await transaction.select().from(admins).where(eq(admins.email, request.email)).limit(1);

        if (existingAdmin?.delYn === 'N') {
          return { status: 'ACTIVE_ADMIN_EXISTS' as const, };
        }

        if (existingAdmin) {
          await transaction.update(admins).set({
            name: request.name,
            role: 'ADMIN',
            passwordHash: input.passwordHash,
            passwordChangeRequiredYn: 'Y',
            passwordChangeRequiredDate: input.now,
            useYn: 'Y',
            delYn: 'N',
            deleteId: null,
            deleteDate: null,
            updateId: input.actorAdminId,
            updateDate: input.now,
          }).where(and(
            eq(admins.id, existingAdmin.id),
            eq(admins.delYn, 'Y'),
          ));
        } else {
          await transaction.insert(admins).values({
            email: request.email,
            name: request.name,
            role: 'ADMIN',
            passwordHash: input.passwordHash,
            passwordChangeRequiredYn: 'Y',
            passwordChangeRequiredDate: input.now,
            createId: input.actorAdminId,
            updateId: input.actorAdminId,
            createDate: input.now,
            updateDate: input.now,
          });
        }

        const [
          approved,
        ] = await transaction.update(adminPermissionRequests).set({
          status: 'APPROVED',
          reviewedByAdminId: input.actorAdminId,
          reviewedDate: input.now,
          updateId: input.actorAdminId,
          updateDate: input.now,
        }).where(eq(adminPermissionRequests.id, input.requestId)).returning();

        if (!approved) {
          throw new Error('관리자 권한 요청 승인 결과를 확인할 수 없습니다.');
        }

        return {
          status: 'APPROVED' as const,
          request: toRecord(approved),
        };
      });
    },

    async markRejected(requestId, actorAdminId, reason, now) {
      const [
        row,
      ] = await database.update(adminPermissionRequests).set({
        status: 'REJECTED',
        reviewedByAdminId: actorAdminId,
        reviewedDate: now,
        rejectionReason: reason,
        updateId: actorAdminId,
        updateDate: now,
      }).where(and(
        eq(adminPermissionRequests.id, requestId),
        eq(adminPermissionRequests.status, 'PENDING'),
        eq(adminPermissionRequests.delYn, 'N'),
      )).returning();
      return row ? toRecord(row) : undefined;
    },

    async markCredentialDelivered(requestId, now) {
      await database.update(adminPermissionRequests).set({
        credentialDeliveredDate: now,
        credentialDeliveryFailedDate: null,
        updateDate: now,
      }).where(eq(adminPermissionRequests.id, requestId));
    },

    async markCredentialDeliveryFailed(requestId, now) {
      await database.update(adminPermissionRequests).set({
        credentialDeliveryFailedDate: now,
        updateDate: now,
      }).where(eq(adminPermissionRequests.id, requestId));
    },
  };
}
