import { sql } from 'drizzle-orm';
import { bigint, char, check, index, integer, pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { commonColumns } from './common.columns';
import { sections } from './sections.table';
import { templates } from './templates.table';

export const templateSections = pgTable('template_sections', {
  ...commonColumns(),
  templateId: bigint('template_id', { mode: 'number', }).notNull().references(() => templates.id, { onDelete: 'no action', }),
  sectionId: bigint('section_id', { mode: 'number', }).notNull().references(() => sections.id, { onDelete: 'no action', }),
  upperSectionId: bigint('upper_section_id', { mode: 'number', }).references(() => sections.id, { onDelete: 'no action', }),
  order: integer('order').notNull().default(0),
  requiredYn: char('required_yn', {
    length: 1,
    enum: [
      'Y',
      'N',
    ],
  }).notNull().default('N'),
}, table => [
  uniqueIndex('uq_template_sections_template_section').on(table.templateId, table.sectionId),
  index('idx_template_sections_template_order').on(table.templateId, table.order),
  index('idx_template_sections_upper').on(table.templateId, table.upperSectionId),
  check('ck_template_sections_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_template_sections_del_yn', sql`${table.delYn} in ('Y', 'N')`),
  check('ck_template_sections_required_yn', sql`${table.requiredYn} in ('Y', 'N')`),
]);
