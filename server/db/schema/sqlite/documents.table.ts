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
import { templates } from './templates.table';
import { worlds } from './worlds.table';

export const documents = sqliteTable('documents', {
  ...commonColumns(),
  worldId: integer('world_id').notNull().references(() => worlds.id, { onDelete: 'no action', }),
  templateId: integer('template_id').references(() => templates.id, { onDelete: 'no action', }),
  templateVersion: integer('template_version'),
  title: text('title').notNull(),
  content: text('content').notNull().default(''),
}, table => [
  uniqueIndex('uq_documents_world_title').on(table.worldId, table.title),
  index('idx_documents_world').on(table.worldId),
  index('idx_documents_template').on(table.templateId),
  index('idx_documents_status').on(table.worldId, table.useYn, table.delYn),
  check('ck_documents_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_documents_del_yn', sql`${table.delYn} in ('Y', 'N')`),
]);
