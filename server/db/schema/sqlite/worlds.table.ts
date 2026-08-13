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
import { projects } from './projects.table';

export const worlds = sqliteTable('worlds', {
  ...commonColumns(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'no action', }),
  name: text('name').notNull(),
  description: text('description'),
}, table => [
  uniqueIndex('uq_worlds_project_name').on(table.projectId, table.name),
  index('idx_worlds_project').on(table.projectId),
  index('idx_worlds_status').on(table.projectId, table.useYn, table.delYn),
  check('ck_worlds_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_worlds_del_yn', sql`${table.delYn} in ('Y', 'N')`),
]);
