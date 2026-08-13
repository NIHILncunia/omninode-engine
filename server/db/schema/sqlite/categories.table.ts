import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';
import { commonColumns } from './common.columns';
import { templates } from './templates.table';
import { worlds } from './worlds.table';

export const categories = sqliteTable('categories', {
  ...commonColumns(),
  worldId: integer('world_id').notNull().references(() => worlds.id, { onDelete: 'no action', }),
  upperCategoryId: integer('upper_category_id').references(() => categories.id, { onDelete: 'no action', }),
  templateId: integer('template_id').references(() => templates.id, { onDelete: 'no action', }),
  name: text('name').notNull(),
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
