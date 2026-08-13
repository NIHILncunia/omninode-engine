import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';

export const projects = sqliteTable('projects', {
  ...commonColumns(),
  adminId: integer('admin_id').notNull().references(() => admins.id, { onDelete: 'no action', }),
  name: text('name').notNull(),
  description: text('description'),
}, table => [
  uniqueIndex('uq_projects_admin_name').on(table.adminId, table.name),
  index('idx_projects_admin').on(table.adminId),
  index('idx_projects_status').on(table.adminId, table.useYn, table.delYn),
  check('ck_projects_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_projects_del_yn', sql`${table.delYn} in ('Y', 'N')`),
]);
