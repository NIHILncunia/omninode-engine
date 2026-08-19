import { bigint, pgTable, unique } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';
import { documents } from './documents.table';
import { relationshipRoles } from './relationshipRoles.table';
import { relationships } from './relationships.table';

export const relationshipTargets = pgTable('relationship_targets', {
  ...commonColumns(() => admins.id),
  relationshipId: bigint('relationship_id', { mode: 'number', })
    .notNull()
    .references(() => relationships.id, { onDelete: 'no action', }),
  relationshipRoleId: bigint('relationship_role_id', { mode: 'number', })
    .notNull()
    .references(() => relationshipRoles.id, { onDelete: 'no action', }),
  documentId: bigint('document_id', { mode: 'number', })
    .notNull()
    .references(() => documents.id, { onDelete: 'no action', }),
}, table => [
  unique('uq_relationship_targets_relationship_id_relationship_role_id')
    .on(table.relationshipId, table.relationshipRoleId),
]);
