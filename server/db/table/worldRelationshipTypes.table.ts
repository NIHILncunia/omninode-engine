import { sql } from 'drizzle-orm';
import { bigint, pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
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
  uniqueIndex('uq_world_relationship_types_world_id_relationship_type_id_active')
    .on(table.worldId, table.relationshipTypeId)
    .where(sql`${table.delYn} = 'N'`),
]);
