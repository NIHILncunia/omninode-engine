import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';
import { worldRelationshipTypes } from './worldRelationshipTypes.table';
import { worlds } from './worlds.table';

export const documentRelationships = sqliteTable('document_relationships', {
  ...commonColumns(),
  worldId: integer('world_id').notNull().references(() => worlds.id, { onDelete: 'no action', }),
  worldRelationshipTypeId: integer('world_relationship_type_id').notNull().references(() => worldRelationshipTypes.id, { onDelete: 'no action', }),
  createdByAdminId: integer('created_by_admin_id').notNull().references(() => admins.id, { onDelete: 'no action', }),
  description: text('description'),
}, table => [
  index('idx_document_relationships_world').on(table.worldId, table.useYn, table.delYn),
  index('idx_document_relationships_type').on(table.worldRelationshipTypeId),
  index('idx_document_relationships_creator').on(table.createdByAdminId),
  check('ck_document_relationships_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_document_relationships_del_yn', sql`${table.delYn} in ('Y', 'N')`),
]);
