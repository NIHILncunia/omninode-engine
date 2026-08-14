import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';
import { commonColumns } from './common.columns';

export const sections = sqliteTable('sections', {
  ...commonColumns(),
  title: text('title').notNull(),
  level: integer('level').notNull(),
  sectionType: text('section_type', {
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
