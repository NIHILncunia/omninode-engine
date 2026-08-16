import { sql } from 'drizzle-orm';
import { bigint, check, index, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';

export const adminPermissionRequests = pgTable('admin_permission_requests', {
  ...commonColumns(),
  email: varchar('email', { length: 320, }).notNull(),
  name: varchar('name', { length: 100, }).notNull(),
  status: varchar('status', {
    length: 20,
    enum: [
      'PENDING',
      'APPROVED',
      'REJECTED',
    ],
  }).notNull().default('PENDING'),
  reviewedByAdminId: bigint('reviewed_by_admin_id', { mode: 'number', }).references(() => admins.id, { onDelete: 'no action', }),
  reviewedDate: timestamp('reviewed_date', { withTimezone: true, }),
  rejectionReason: varchar('rejection_reason', { length: 500, }),
  credentialDeliveredDate: timestamp('credential_delivered_date', { withTimezone: true, }),
  credentialDeliveryFailedDate: timestamp('credential_delivery_failed_date', { withTimezone: true, }),
}, table => [
  uniqueIndex('uq_admin_permission_requests_pending_email').on(table.email).where(sql`${table.status} = 'PENDING' and ${table.delYn} = 'N'`),
  index('idx_admin_permission_requests_status').on(table.status, table.useYn, table.delYn),
  check('ck_admin_permission_requests_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_admin_permission_requests_del_yn', sql`${table.delYn} in ('Y', 'N')`),
  check('ck_admin_permission_requests_status', sql`${table.status} in ('PENDING', 'APPROVED', 'REJECTED')`),
]);
