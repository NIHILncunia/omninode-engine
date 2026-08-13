import { sql } from 'drizzle-orm';
import { bigint, check, index, integer, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { commonColumns } from './common.columns';
import { worlds } from './worlds.table';

export const templates = pgTable('templates', {
  ...commonColumns(),
  worldId: bigint('world_id', { mode: 'number', }).notNull().references(() => worlds.id, { onDelete: 'no action', }),
  name: varchar('name', { length: 200, }).notNull(),
  description: text('description'),
  version: integer('version').notNull().default(1),
}, table => [
  uniqueIndex('uq_templates_world_name').on(table.worldId, table.name),
  index('idx_templates_world').on(table.worldId),
  index('idx_templates_status').on(table.worldId, table.useYn, table.delYn),
  check('ck_templates_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_templates_del_yn', sql`${table.delYn} in ('Y', 'N')`),
  check('ck_templates_version', sql`${table.version} >= 1`),
]);
