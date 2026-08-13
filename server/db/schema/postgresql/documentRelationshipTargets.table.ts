import { sql } from 'drizzle-orm';
import { bigint, check, index, pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { commonColumns } from './common.columns';
import { documentRelationships } from './documentRelationships.table';
import { documents } from './documents.table';
import { relationshipTypeRoles } from './relationshipTypeRoles.table';

export const documentRelationshipTargets = pgTable('document_relationship_targets', {
  ...commonColumns(),
  documentRelationshipId: bigint('document_relationship_id', { mode: 'number', }).notNull().references(() => documentRelationships.id, { onDelete: 'no action', }),
  relationshipTypeRoleId: bigint('relationship_type_role_id', { mode: 'number', }).notNull().references(() => relationshipTypeRoles.id, { onDelete: 'no action', }),
  documentId: bigint('document_id', { mode: 'number', }).notNull().references(() => documents.id, { onDelete: 'no action', }),
}, table => [
  uniqueIndex('uq_document_relationship_targets_role').on(table.documentRelationshipId, table.relationshipTypeRoleId),
  uniqueIndex('uq_document_relationship_targets_document').on(table.documentRelationshipId, table.documentId),
  index('idx_document_relationship_targets_document').on(table.documentId),
  index('idx_document_relationship_targets_role').on(table.relationshipTypeRoleId),
  check('ck_document_relationship_targets_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_document_relationship_targets_del_yn', sql`${table.delYn} in ('Y', 'N')`),
]);
