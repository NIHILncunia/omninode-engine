import { bigint, char, pgTable, unique } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonChecks, commonColumns, ynCheck } from './common.columns';
import { projects } from './projects.table';

export const projectAdminPermissions = pgTable('project_admin_permissions', {
  ...commonColumns(() => admins.id),
  projectId: bigint('project_id', { mode: 'number', })
    .notNull()
    .references(() => projects.id, { onDelete: 'no action', }),
  adminId: bigint('admin_id', { mode: 'number', })
    .notNull()
    .references(() => admins.id, { onDelete: 'no action', }),
  worldCreateYn: char('world_create_yn', { length: 1, })
    .notNull()
    .default('N'),
  worldUpdateYn: char('world_update_yn', { length: 1, })
    .notNull()
    .default('N'),
  worldDeleteYn: char('world_delete_yn', { length: 1, })
    .notNull()
    .default('N'),
  projectCreateYn: char('project_create_yn', { length: 1, })
    .notNull()
    .default('N'),
  projectUpdateYn: char('project_update_yn', { length: 1, })
    .notNull()
    .default('N'),
  projectDeleteYn: char('project_delete_yn', { length: 1, })
    .notNull()
    .default('N'),
  categoryCreateYn: char('category_create_yn', { length: 1, })
    .notNull()
    .default('N'),
  categoryUpdateYn: char('category_update_yn', { length: 1, })
    .notNull()
    .default('N'),
  categoryDeleteYn: char('category_delete_yn', { length: 1, })
    .notNull()
    .default('N'),
  templateCreateYn: char('template_create_yn', { length: 1, })
    .notNull()
    .default('N'),
  templateUpdateYn: char('template_update_yn', { length: 1, })
    .notNull()
    .default('N'),
  templateDeleteYn: char('template_delete_yn', { length: 1, })
    .notNull()
    .default('N'),
  relationshipCreateYn: char('relationship_create_yn', { length: 1, })
    .notNull()
    .default('N'),
  relationshipUpdateYn: char('relationship_update_yn', { length: 1, })
    .notNull()
    .default('N'),
  relationshipDeleteYn: char('relationship_delete_yn', { length: 1, })
    .notNull()
    .default('N'),
  documentCreateYn: char('document_create_yn', { length: 1, })
    .notNull()
    .default('N'),
  documentUpdateYn: char('document_update_yn', { length: 1, })
    .notNull()
    .default('N'),
  documentDeleteYn: char('document_delete_yn', { length: 1, })
    .notNull()
    .default('N'),
  subAdminInviteCreateYn: char('sub_admin_invite_create_yn', { length: 1, })
    .notNull()
    .default('N'),
  subAdminInviteUpdateYn: char('sub_admin_invite_update_yn', { length: 1, })
    .notNull()
    .default('N'),
  subAdminInviteDeleteYn: char('sub_admin_invite_delete_yn', { length: 1, })
    .notNull()
    .default('N'),
}, table => [
  unique('uq_project_admin_permissions_project_id_admin_id')
    .on(table.projectId, table.adminId),
  ...commonChecks('project_admin_permissions', table.useYn, table.delYn),
  ...Object.entries(table)
    .filter(([
      key,
    ]) => key.endsWith('Yn') && key !== 'useYn' && key !== 'delYn')
    .map(([
      _key,
      column,
    ]) => ynCheck(`ck_project_admin_permissions_${column.name}`, column)),
]);
