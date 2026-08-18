import { sql } from 'drizzle-orm';
import { check, foreignKey, pgTable, unique, varchar } from 'drizzle-orm/pg-core';
import { commonChecks, commonColumns, ynCheck } from './common.columns';

export const admins = pgTable('admins', {
  ...commonColumns(),
  email: varchar('email')
    .notNull(),
  password: varchar('password')
    .notNull(),
  name: varchar('name')
    .notNull(),
  role: varchar('role', {
    enum: [
      'SUPER_ADMIN',
      'ADMIN',
      'SUB_ADMIN',
    ],
  })
    .notNull(),
  passwordChangedYn: varchar('password_changed_yn', { length: 1, })
    .notNull()
    .default('N'),
}, table => [
  unique('uq_admins_email')
    .on(table.email),
  foreignKey({
    columns: [
      table.createId,
    ],
    foreignColumns: [
      table.id,
    ],
    name: 'fk_admins_create_id',
  })
    .onDelete('no action'),
  foreignKey({
    columns: [
      table.updateId,
    ],
    foreignColumns: [
      table.id,
    ],
    name: 'fk_admins_update_id',
  })
    .onDelete('no action'),
  foreignKey({
    columns: [
      table.deleteId,
    ],
    foreignColumns: [
      table.id,
    ],
    name: 'fk_admins_delete_id',
  })
    .onDelete('no action'),
  ...commonChecks('admins', table.useYn, table.delYn),
  ynCheck('ck_admins_password_changed_yn', table.passwordChangedYn),
  check('ck_admins_role', sql`${table.role} in ('SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN')`),
]);
