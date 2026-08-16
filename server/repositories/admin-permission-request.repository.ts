import { and, desc, eq } from 'drizzle-orm';
import type { DatabaseClient } from '../db/client';
import { adminPermissionRequests } from '../db/schema/postgresql';
import type {
  AdminPermissionRequestRecord,
  AdminPermissionRequestRepository,
} from '../types/admin-permission-request.types';

function toRecord(row: typeof adminPermissionRequests.$inferSelect): AdminPermissionRequestRecord {
  return {
    async list() {
      const rows = await database.select().from(adminPermissionRequests).where(eq(
        adminPermissionRequests.delYn,
        'N',
      )).orderBy(desc(adminPermissionRequests.id));
      return rows.map(toRecord);
    },

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

    async markApproved(requestId, actorAdminId, now) {
      const [
        row,
      ] = await database.update(adminPermissionRequests).set({
        status: 'APPROVED',
        reviewedByAdminId: actorAdminId,
        reviewedDate: now,
        updateId: actorAdminId,
        updateDate: now,
      }).where(and(
        eq(adminPermissionRequests.id, requestId),
        eq(adminPermissionRequests.status, 'PENDING'),
        eq(adminPermissionRequests.delYn, 'N'),
      )).returning();
      return row ? toRecord(row) : undefined;
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
