import { bigint, pgTable, unique } from 'drizzle-orm/pg-core';
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
  unique('uq_project_categories_project_id_category_id')
    .on(table.projectId, table.categoryId),
]);
