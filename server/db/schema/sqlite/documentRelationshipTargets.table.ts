import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { commonColumns } from './common.columns';
import { documentRelationships } from './documentRelationships.table';
import { documents } from './documents.table';
import { relationshipTypeRoles } from './relationshipTypeRoles.table';

export const documentRelationshipTargets = sqliteTable('document_relationship_targets', {
  ...commonColumns(),
  documentRelationshipId: integer('document_relationship_id').notNull().references(() => documentRelationships.id, { onDelete: 'no action', }),
  relationshipTypeRoleId: integer('relationship_type_role_id').notNull().references(() => relationshipTypeRoles.id, { onDelete: 'no action', }),
  documentId: integer('document_id').notNull().references(() => documents.id, { onDelete: 'no action', }),
}, table => [
  uniqueIndex('uq_document_relationship_targets_role').on(table.documentRelationshipId, table.relationshipTypeRoleId),
  uniqueIndex('uq_document_relationship_targets_document').on(table.documentRelationshipId, table.documentId),
  index('idx_document_relationship_targets_document').on(table.documentId),
  index('idx_document_relationship_targets_role').on(table.relationshipTypeRoleId),
  check('ck_document_relationship_targets_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_document_relationship_targets_del_yn', sql`${table.delYn} in ('Y', 'N')`),
]);
