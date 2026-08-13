import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { commonColumns } from './common.columns';
import { relationshipTypes } from './relationshipTypes.table';
import { worlds } from './worlds.table';

export const worldRelationshipTypes = sqliteTable('world_relationship_types', {
  ...commonColumns(),
  worldId: integer('world_id').notNull().references(() => worlds.id, { onDelete: 'no action', }),
  relationshipTypeId: integer('relationship_type_id').notNull().references(() => relationshipTypes.id, { onDelete: 'no action', }),
}, table => [
  uniqueIndex('uq_world_relationship_types').on(table.worldId, table.relationshipTypeId),
  index('idx_world_relationship_types_world').on(table.worldId, table.useYn, table.delYn),
  index('idx_world_relationship_types_type').on(table.relationshipTypeId),
  check('ck_world_relationship_types_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_world_relationship_types_del_yn', sql`${table.delYn} in ('Y', 'N')`),
]);
