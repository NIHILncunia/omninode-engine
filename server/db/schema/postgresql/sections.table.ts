import { sql } from 'drizzle-orm';
import { bigint, check, index, integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { commonColumns } from './common.columns';

export const sections = pgTable('sections', {
  ...commonColumns(),
  title: varchar('title', { length: 300, }).notNull(),
  level: integer('level').notNull(),
  sectionType: varchar('section_type', {
    length: 20,
    enum: [
      'TEMPLATE',
      'DOCUMENT',
    ],
  }).notNull(),
}, table => [
  index('idx_sections_type').on(table.sectionType),
  index('idx_sections_status').on(table.sectionType, table.useYn, table.delYn),
  check('ck_sections_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_sections_del_yn', sql`${table.delYn} in ('Y', 'N')`),
  check('ck_sections_level', sql`${table.level} between 1 and 6`),
  check('ck_sections_section_type', sql`${table.sectionType} in ('TEMPLATE', 'DOCUMENT')`),
]);
