import { sql } from 'drizzle-orm';
import { char, check, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { commonColumns } from './common.columns';

export const permissions = pgTable('permissions', {
  ...commonColumns(),
  code: varchar('code', { length: 100, }).notNull(),
  name: varchar('name', { length: 200, }).notNull(),
}, table => [
  uniqueIndex('uq_permissions_code').on(table.code),
  check('ck_permissions_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_permissions_del_yn', sql`${table.delYn} in ('Y', 'N')`),
]);
