import { sql } from 'drizzle-orm';
import { bigint, check, index, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';

export const projects = pgTable('projects', {
  ...commonColumns(),
  adminId: bigint('admin_id', { mode: 'number', }).notNull().references(() => admins.id, { onDelete: 'no action', }),
  name: varchar('name', { length: 200, }).notNull(),
  description: text('description'),
}, table => [
  uniqueIndex('uq_projects_admin_name').on(table.adminId, table.name),
  index('idx_projects_admin').on(table.adminId),
  index('idx_projects_status').on(table.adminId, table.useYn, table.delYn),
  check('ck_projects_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_projects_del_yn', sql`${table.delYn} in ('Y', 'N')`),
]);
