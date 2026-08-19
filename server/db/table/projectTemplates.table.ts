import { sql } from 'drizzle-orm';
import { bigint, pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { categories } from './categories.table';
import { commonColumns } from './common.columns';
import { projects } from './projects.table';
import { templates } from './templates.table';

export const projectTemplates = pgTable('project_templates', {
  ...commonColumns(() => admins.id),
  projectId: bigint('project_id', { mode: 'number', })
    .notNull()
    .references(() => projects.id, { onDelete: 'no action', }),
  categoryId: bigint('category_id', { mode: 'number', })
    .references(() => categories.id, { onDelete: 'no action', }),
  templateId: bigint('template_id', { mode: 'number', })
    .notNull()
    .references(() => templates.id, { onDelete: 'no action', }),
}, table => [
  uniqueIndex('uq_project_templates_project_id_category_id_active')
    .on(table.projectId, table.categoryId)
    .where(sql`${table.delYn} = 'N' and ${table.categoryId} is not null`),
]);
