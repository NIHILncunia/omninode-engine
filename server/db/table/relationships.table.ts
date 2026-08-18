import { bigint, pgTable } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonChecks, commonColumns } from './common.columns';
import { relationshipTypes } from './relationshipTypes.table';
import { worlds } from './worlds.table';

export const relationships = pgTable('relationships', {
  ...commonColumns(() => admins.id),
  worldId: bigint('world_id', { mode: 'number', })
    .notNull()
    .references(() => worlds.id, { onDelete: 'no action', }),
  relationshipTypeId: bigint('relationship_type_id', { mode: 'number', })
    .notNull()
    .references(() => relationshipTypes.id, { onDelete: 'no action', }),
}, table => commonChecks('relationships', table.useYn, table.delYn));
