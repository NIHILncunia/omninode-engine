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
import { documents } from './documents.table';
import { sections } from './sections.table';

export const documentSections = sqliteTable('document_sections', {
  ...commonColumns(),
  documentId: integer('document_id').notNull().references(() => documents.id, { onDelete: 'no action', }),
  sectionId: integer('section_id').notNull().references(() => sections.id, { onDelete: 'no action', }),
  upperSectionId: integer('upper_section_id').references(() => sections.id, { onDelete: 'no action', }),
  order: integer('order').notNull().default(0),
  templateSectionYn: text('template_section_yn', {
    enum: [
      'Y',
      'N',
    ],
  }).notNull().default('N'),
  appliedTemplateVersion: integer('applied_template_version'),
}, table => [
  uniqueIndex('uq_document_sections_document_section').on(table.documentId, table.sectionId),
  index('idx_document_sections_order').on(table.documentId, table.order),
  index('idx_document_sections_upper').on(table.documentId, table.upperSectionId),
  check('ck_document_sections_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_document_sections_del_yn', sql`${table.delYn} in ('Y', 'N')`),
  check('ck_document_sections_template_section_yn', sql`${table.templateSectionYn} in ('Y', 'N')`),
]);
