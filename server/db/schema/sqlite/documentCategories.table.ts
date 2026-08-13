import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { categories } from './categories.table';
import { commonColumns } from './common.columns';
import { documents } from './documents.table';

export const documentCategories = sqliteTable('document_categories', {
  ...commonColumns(),
  documentId: integer('document_id').notNull().references(() => documents.id, { onDelete: 'no action', }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'no action', }),
  level: integer('level').notNull(),
}, table => [
  uniqueIndex('uq_document_categories_level').on(table.documentId, table.level),
  uniqueIndex('uq_document_categories_category').on(table.documentId, table.categoryId),
  index('idx_document_categories_category').on(table.categoryId, table.documentId),
  check('ck_document_categories_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_document_categories_del_yn', sql`${table.delYn} in ('Y', 'N')`),
  check('ck_document_categories_level', sql`${table.level} between 1 and 3`),
]);
