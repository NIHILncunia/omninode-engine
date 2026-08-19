import { sql } from 'drizzle-orm';
import { bigint, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { categories } from './categories.table';
import { commonColumns } from './common.columns';
import { projects } from './projects.table';

export const documents = pgTable('documents', {
  ...commonColumns(() => admins.id),
  projectId: bigint('project_id', { mode: 'number', })
    .notNull()
    .references(() => projects.id, { onDelete: 'no action', }),
  title: varchar('title')
    .notNull(),
  categoryId: bigint('category_id', { mode: 'number', })
    .notNull()
    .references(() => categories.id, { onDelete: 'no action', }),
  subCategory1Id: bigint('sub_category_1_id', { mode: 'number', })
    .references(() => categories.id, { onDelete: 'no action', }),
  subCategory2Id: bigint('sub_category_2_id', { mode: 'number', })
    .references(() => categories.id, { onDelete: 'no action', }),
}, table => [
  uniqueIndex('uq_documents_project_id_title_active')
    .on(table.projectId, table.title)
    .where(sql`${table.delYn} = 'N'`),
]);
