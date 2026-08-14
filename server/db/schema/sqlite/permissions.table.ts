import { sql } from 'drizzle-orm';
import {
  check,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { commonColumns } from './common.columns';

export const permissions = sqliteTable('permissions', {
  ...commonColumns(),
  code: text('code').notNull(),
  name: text('name').notNull(),
}, table => [
  uniqueIndex('uq_permissions_code').on(table.code),
  check('ck_permissions_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_permissions_del_yn', sql`${table.delYn} in ('Y', 'N')`),
]);
