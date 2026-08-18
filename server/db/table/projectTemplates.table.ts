import { bigint, pgTable, unique } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { categories } from './categories.table';
import { commonChecks, commonColumns } from './common.columns';
import { projects } from './projects.table';
import { templates } from './templates.table';

export const projectTemplates = pgTable('project_templates', {
  ...commonColumns(() => admins.id),
  projectId: bigint('project_id', { mode: 'number', })
    .notNull()
    .references(() => projects.id, { onDelete: 'no action', }),
  categoryId: bigint('category_id', { mode: 'number', })
    .notNull()
    .references(() => categories.id, { onDelete: 'no action', }),
  templateId: bigint('template_id', { mode: 'number', })
    .notNull()
    .references(() => templates.id, { onDelete: 'no action', }),
}, table => [
  unique('uq_project_templates_project_id_category_id')
    .on(table.projectId, table.categoryId),
  ...commonChecks('project_templates', table.useYn, table.delYn),
]);
