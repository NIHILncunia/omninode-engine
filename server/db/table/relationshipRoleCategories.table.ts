import { sql } from 'drizzle-orm';
import { bigint, pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { categories } from './categories.table';
import { commonColumns } from './common.columns';
import { relationshipRoles } from './relationshipRoles.table';

export const relationshipRoleCategories = pgTable('relationship_role_categories', {
  ...commonColumns(() => admins.id),
  relationshipRoleId: bigint('relationship_role_id', { mode: 'number', })
    .notNull()
    .references(() => relationshipRoles.id, { onDelete: 'no action', }),
  categoryId: bigint('category_id', { mode: 'number', })
    .notNull()
    .references(() => categories.id, { onDelete: 'no action', }),
}, table => [
  uniqueIndex('uq_relationship_role_categories_relationship_role_id_category_id_active')
    .on(table.relationshipRoleId, table.categoryId)
    .where(sql`${table.delYn} = 'N'`),
]);
