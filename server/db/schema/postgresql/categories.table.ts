import { sql } from 'drizzle-orm';
import { bigint, check, index, integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { commonColumns } from './common.columns';
import { templates } from './templates.table';
import { worlds } from './worlds.table';

export const categories = pgTable('categories', {
  ...commonColumns(),
  worldId: bigint('world_id', { mode: 'number', }).notNull().references(() => worlds.id, { onDelete: 'no action', }),
  upperCategoryId: bigint('upper_category_id', { mode: 'number', }).references(() => categories.id, { onDelete: 'no action', }),
  templateId: bigint('template_id', { mode: 'number', }).references(() => templates.id, { onDelete: 'no action', }),
  name: varchar('name', { length: 200, }).notNull(),
  level: integer('level').notNull(),
  order: integer('order').notNull().default(0),
}, table => [
  index('idx_categories_status').on(table.worldId, table.useYn, table.delYn),
  index('idx_categories_world').on(table.worldId),
  index('idx_categories_upper').on(table.upperCategoryId),
  index('idx_categories_template').on(table.templateId),
  index('idx_categories_tree').on(table.worldId, table.upperCategoryId, table.order),
  check('ck_categories_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_categories_del_yn', sql`${table.delYn} in ('Y', 'N')`),
  check('ck_categories_level', sql`${table.level} between 1 and 3`),
]);
