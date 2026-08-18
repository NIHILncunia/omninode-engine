import { sql } from 'drizzle-orm';
import { bigint, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonChecks, commonColumns } from './common.columns';
import { worlds } from './worlds.table';

export const projects = pgTable('projects', {
  ...commonColumns(() => admins.id),
  worldId: bigint('world_id', { mode: 'number', })
    .notNull()
    .references(() => worlds.id, { onDelete: 'no action', }),
  name: varchar('name')
    .notNull(),
}, table => [
  uniqueIndex('uq_projects_world_id_name_active')
    .on(table.worldId, table.name)
    .where(sql`${table.delYn} = 'N'`),
  ...commonChecks('projects', table.useYn, table.delYn),
]);
