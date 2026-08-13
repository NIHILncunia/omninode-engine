import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { categories } from './categories.table';
import { commonColumns } from './common.columns';
import { relationshipTypeRoles } from './relationshipTypeRoles.table';
import { worldRelationshipTypes } from './worldRelationshipTypes.table';

export const worldRelationshipRoleCategories = sqliteTable('world_relationship_role_categories', {
  ...commonColumns(),
  worldRelationshipTypeId: integer('world_relationship_type_id').notNull().references(() => worldRelationshipTypes.id, { onDelete: 'no action', }),
  relationshipTypeRoleId: integer('relationship_type_role_id').notNull().references(() => relationshipTypeRoles.id, { onDelete: 'no action', }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'no action', }),
}, table => [
  uniqueIndex('uq_world_role_categories').on(table.worldRelationshipTypeId, table.relationshipTypeRoleId, table.categoryId),
  index('idx_world_role_categories_role').on(table.worldRelationshipTypeId, table.relationshipTypeRoleId),
  index('idx_world_role_categories_category').on(table.categoryId),
  check('ck_world_relationship_role_categories_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_world_relationship_role_categories_del_yn', sql`${table.delYn} in ('Y', 'N')`),
]);
