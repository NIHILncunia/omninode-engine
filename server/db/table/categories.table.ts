import { sql } from 'drizzle-orm';
import { bigint, check, foreignKey, pgTable, smallint, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';

export const categories = pgTable('categories', {
  ...commonColumns(() => admins.id),
  parentId: bigint('parent_id', { mode: 'number', }),
  name: varchar('name')
    .notNull(),
  depth: smallint('depth')
    .notNull(),
  defaultYn: varchar('default_yn', {
    enum: [
      'Y',
      'N',
    ],
    length: 1,
  })
    .notNull()
    .default('N'),
}, table => [
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
  check('ck_categories_depth', sql`${table.depth} between 1 and 3`),
]);
