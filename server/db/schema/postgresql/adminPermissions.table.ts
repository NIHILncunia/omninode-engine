import { sql } from 'drizzle-orm';
import { bigint, char, check, index, pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';
import { permissions } from './permissions.table';

export const adminPermissions = pgTable('admin_permissions', {
  ...commonColumns(),
  adminId: bigint('admin_id', { mode: 'number', }).notNull().references(() => admins.id, { onDelete: 'no action', }),
  permissionId: bigint('permission_id', { mode: 'number', }).notNull().references(() => permissions.id, { onDelete: 'no action', }),
  grantYn: char('grant_yn', {
    length: 1,
    enum: [
      'Y',
      'N',
    ],
  }).notNull().default('Y'),
}, table => [
  uniqueIndex('uq_admin_permissions_admin_permission').on(table.adminId, table.permissionId),
  index('idx_admin_permissions_admin').on(table.adminId, table.useYn, table.delYn),
  check('ck_admin_permissions_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_admin_permissions_del_yn', sql`${table.delYn} in ('Y', 'N')`),
  check('ck_admin_permissions_grant_yn', sql`${table.grantYn} in ('Y', 'N')`),
]);
