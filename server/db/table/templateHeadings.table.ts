import { sql } from 'drizzle-orm';
import { bigint, check, integer, pgTable, smallint, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';
import { templates } from './templates.table';

export const templateHeadings = pgTable('template_headings', {
  ...commonColumns(() => admins.id),
  templateId: bigint('template_id', { mode: 'number', })
    .notNull()
    .references(() => templates.id, { onDelete: 'no action', }),
  label: varchar('label')
    .notNull(),
  level: smallint('level')
    .notNull(),
  sortOrder: integer('sort_order')
    .notNull(),
}, table => [
  uniqueIndex('uq_template_headings_template_id_sort_order_active')
    .on(table.templateId, table.sortOrder)
    .where(sql`${table.delYn} = 'N'`),
  check('ck_template_headings_level', sql`${table.level} between 1 and 3`),
]);
