import { sql } from 'drizzle-orm';
import { check, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonChecks, commonColumns } from './common.columns';

export const adminRequests = pgTable('admin_requests', {
  ...commonColumns(() => admins.id),
  email: varchar('email')
    .notNull(),
  name: varchar('name')
    .notNull(),
  status: varchar('status', {
    enum: [
      'PENDING',
      'APPROVED',
      'REJECTED',
    ],
  })
    .notNull()
    .default('PENDING'),
}, table => [
  uniqueIndex('uq_admin_requests_email_pending')
    .on(table.email)
    .where(sql`${table.status} = 'PENDING' and ${table.delYn} = 'N'`),
  ...commonChecks('admin_requests', table.useYn, table.delYn),
  check('ck_admin_requests_status', sql`${table.status} in ('PENDING', 'APPROVED', 'REJECTED')`),
]);
