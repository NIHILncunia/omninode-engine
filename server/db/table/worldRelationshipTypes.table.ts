import { bigint, pgTable, unique } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';
import { relationshipTypes } from './relationshipTypes.table';
import { worlds } from './worlds.table';

export const worldRelationshipTypes = pgTable('world_relationship_types', {
  ...commonColumns(() => admins.id),
  worldId: bigint('world_id', { mode: 'number', })
    .notNull()
    .references(() => worlds.id, { onDelete: 'no action', }),
  relationshipTypeId: bigint('relationship_type_id', { mode: 'number', })
    .notNull()
    .references(() => relationshipTypes.id, { onDelete: 'no action', }),
}, table => [
  unique('uq_world_relationship_types_world_id_relationship_type_id')
    .on(table.worldId, table.relationshipTypeId),
]);
