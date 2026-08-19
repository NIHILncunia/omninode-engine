import { sql } from 'drizzle-orm';
import { pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';

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
]);
