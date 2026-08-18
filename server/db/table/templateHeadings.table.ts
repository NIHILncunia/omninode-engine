import { sql } from 'drizzle-orm';
import { bigint, check, integer, pgTable, smallint, unique, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonChecks, commonColumns } from './common.columns';
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
  unique('uq_template_headings_template_id_sort_order')
    .on(table.templateId, table.sortOrder),
  ...commonChecks('template_headings', table.useYn, table.delYn),
  check('ck_template_headings_level', sql`${table.level} in (1, 2, 3)`),
]);
