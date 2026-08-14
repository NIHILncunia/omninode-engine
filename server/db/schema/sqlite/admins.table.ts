import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { commonColumns } from './common.columns';

export const admins = sqliteTable('admins', {
  ...commonColumns(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role', {
    enum: [
      'SUPER_ADMIN',
      'ADMIN',
      'SUB_ADMIN',
    ],
  }).notNull(),
  passwordChangeRequiredYn: text('password_change_required_yn', {
    enum: [
      'Y',
      'N',
    ],
  }).notNull().default('Y'),
  passwordChangeRequiredDate: integer('password_change_required_date', { mode: 'timestamp_ms', }),
  lastSignInDate: integer('last_sign_in_date', { mode: 'timestamp_ms', }),
}, table => [
  uniqueIndex('uq_admins_email').on(table.email),
  index('idx_admins_role').on(table.role),
  index('idx_admins_status').on(table.useYn, table.delYn),
  check('ck_admins_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_admins_del_yn', sql`${table.delYn} in ('Y', 'N')`),
  check('ck_admins_role', sql`${table.role} in ('SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN')`),
  check('ck_admins_password_change_required_yn', sql`${table.passwordChangeRequiredYn} in ('Y', 'N')`),
]);
