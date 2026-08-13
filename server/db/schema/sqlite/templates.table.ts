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
import { worlds } from './worlds.table';

export const templates = sqliteTable('templates', {
  ...commonColumns(),
  worldId: integer('world_id').notNull().references(() => worlds.id, { onDelete: 'no action', }),
  name: text('name').notNull(),
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
