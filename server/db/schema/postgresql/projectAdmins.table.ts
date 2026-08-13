import { sql } from 'drizzle-orm';
import { bigint, check, index, pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';
import { projects } from './projects.table';

export const projectAdmins = pgTable('project_admins', {
  ...commonColumns(),
  projectId: bigint('project_id', { mode: 'number', }).notNull().references(() => projects.id, { onDelete: 'no action', }),
  adminId: bigint('admin_id', { mode: 'number', }).notNull().references(() => admins.id, { onDelete: 'no action', }),
}, table => [
  uniqueIndex('uq_project_admins_project_admin').on(table.projectId, table.adminId),
  index('idx_project_admins_admin').on(table.adminId),
  index('idx_project_admins_status').on(table.projectId, table.useYn, table.delYn),
  check('ck_project_admins_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_project_admins_del_yn', sql`${table.delYn} in ('Y', 'N')`),
]);
