import { sql } from 'drizzle-orm';
import { bigint, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';
import { documents } from './documents.table';

export const documentRevisions = pgTable('document_revisions', {
  ...commonColumns(() => admins.id),
  documentId: bigint('document_id', { mode: 'number', })
    .notNull()
    .references(() => documents.id, { onDelete: 'no action', }),
  content: text('content')
    .notNull()
    .default(''),
  currentYn: varchar('current_yn', { length: 1, })
    .notNull()
    .default('Y'),
}, table => [
  uniqueIndex('uq_document_revisions_document_id_current')
    .on(table.documentId)
    .where(sql`${table.currentYn} = 'Y'`),
]);
