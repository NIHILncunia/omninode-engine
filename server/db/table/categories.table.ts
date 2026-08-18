import { sql } from 'drizzle-orm';
import { bigint, check, foreignKey, pgTable, smallint, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonChecks, commonColumns, ynCheck } from './common.columns';
import { worlds } from './worlds.table';

export const categories = pgTable('categories', {
  ...commonColumns(() => admins.id),
  worldId: bigint('world_id', { mode: 'number', })
    .references(() => worlds.id, { onDelete: 'no action', }),
  parentId: bigint('parent_id', { mode: 'number', }),
  name: varchar('name')
    .notNull(),
  depth: smallint('depth')
    .notNull(),
  defaultYn: varchar('default_yn', { length: 1, })
    .notNull()
    .default('N'),
}, table => [
  ...commonChecks('categories', table.useYn, table.delYn),
  foreignKey({
    columns: [
      table.parentId,
    ],
    foreignColumns: [
      table.id,
    ],
    name: 'fk_categories_parent_id',
  })
    .onDelete('no action'),
  ynCheck('ck_categories_default_yn', table.defaultYn),
  check('ck_categories_depth', sql`${table.depth} between 1 and 3`),
]);
