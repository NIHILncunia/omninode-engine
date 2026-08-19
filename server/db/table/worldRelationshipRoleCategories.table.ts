import { bigint, pgTable, unique } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { categories } from './categories.table';
import { commonColumns } from './common.columns';
import { relationshipRoles } from './relationshipRoles.table';
import { worlds } from './worlds.table';

export const worldRelationshipRoleCategories = pgTable('world_relationship_role_categories', {
  ...commonColumns(() => admins.id),
  worldId: bigint('world_id', { mode: 'number', })
    .notNull()
    .references(() => worlds.id, { onDelete: 'no action', }),
  relationshipRoleId: bigint('relationship_role_id', { mode: 'number', })
    .notNull()
    .references(() => relationshipRoles.id, { onDelete: 'no action', }),
  categoryId: bigint('category_id', { mode: 'number', })
    .notNull()
    .references(() => categories.id, { onDelete: 'no action', }),
}, table => [
  unique('uq_world_relationship_role_categories_world_id_relationship_role_id_category_id')
    .on(table.worldId, table.relationshipRoleId, table.categoryId),
]);
