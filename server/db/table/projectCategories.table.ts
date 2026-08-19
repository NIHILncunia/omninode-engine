import { sql } from 'drizzle-orm';
import { bigint, pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { categories } from './categories.table';
import { commonColumns } from './common.columns';
import { projects } from './projects.table';

export const projectCategories = pgTable('project_categories', {
  ...commonColumns(() => admins.id),
  projectId: bigint('project_id', { mode: 'number', })
    .notNull()
    .references(() => projects.id, { onDelete: 'no action', }),
  categoryId: bigint('category_id', { mode: 'number', })
    .notNull()
    .references(() => categories.id, { onDelete: 'no action', }),
}, table => [
  uniqueIndex('uq_project_categories_category_id_active')
    .on(table.categoryId)
    .where(sql`${table.delYn} = 'N'`),
]);
