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
import { sections } from './sections.table';
import { templates } from './templates.table';

export const templateSections = sqliteTable('template_sections', {
  ...commonColumns(),
  templateId: integer('template_id').notNull().references(() => templates.id, { onDelete: 'no action', }),
  sectionId: integer('section_id').notNull().references(() => sections.id, { onDelete: 'no action', }),
  upperSectionId: integer('upper_section_id').references(() => sections.id, { onDelete: 'no action', }),
  order: integer('order').notNull().default(0),
  requiredYn: text('required_yn', {
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
