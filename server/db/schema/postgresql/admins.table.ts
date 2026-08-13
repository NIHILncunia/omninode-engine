import { sql } from 'drizzle-orm';
import { bigint, char, check, index, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { commonColumns } from './common.columns';

export const admins = pgTable('admins', {
  ...commonColumns(),
  email: varchar('email', { length: 320, }).notNull(),
  passwordHash: varchar('password_hash', { length: 255, }).notNull(),
  name: varchar('name', { length: 100, }).notNull(),
  role: varchar('role', {
    length: 20,
    enum: [
      'SUPER_ADMIN',
      'ADMIN',
      'SUB_ADMIN',
    ],
  }).notNull(),
  createdByAdminId: bigint('created_by_admin_id', { mode: 'number', }).references(() => admins.id, { onDelete: 'no action', }),
  passwordChangeRequiredYn: char('password_change_required_yn', {
    length: 1,
    enum: [
      'Y',
      'N',
    ],
  }).notNull().default('Y'),
  lastLoginDate: timestamp('last_login_date', { withTimezone: true, }),
}, table => [
  uniqueIndex('uq_admins_email').on(table.email),
  index('idx_admins_role').on(table.role),
  index('idx_admins_created_by').on(table.createdByAdminId),
  index('idx_admins_status').on(table.useYn, table.delYn),
  check('ck_admins_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_admins_del_yn', sql`${table.delYn} in ('Y', 'N')`),
  check('ck_admins_role', sql`${table.role} in ('SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN')`),
  check('ck_admins_password_change_required_yn', sql`${table.passwordChangeRequiredYn} in ('Y', 'N')`),
]);
