import { sql } from 'drizzle-orm';
import { bigint, check, index, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { commonColumns } from './common.columns';
import { projects } from './projects.table';

export const worlds = pgTable('worlds', {
  ...commonColumns(),
  projectId: bigint('project_id', { mode: 'number', }).notNull().references(() => projects.id, { onDelete: 'no action', }),
  name: varchar('name', { length: 200, }).notNull(),
  description: text('description'),
}, table => [
  uniqueIndex('uq_worlds_project_name').on(table.projectId, table.name),
  index('idx_worlds_project').on(table.projectId),
  index('idx_worlds_status').on(table.projectId, table.useYn, table.delYn),
  check('ck_worlds_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_worlds_del_yn', sql`${table.delYn} in ('Y', 'N')`),
]);
