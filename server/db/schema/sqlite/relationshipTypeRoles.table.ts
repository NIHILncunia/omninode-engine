import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { commonColumns } from './common.columns';
import { relationshipTypes } from './relationshipTypes.table';

export const relationshipTypeRoles = sqliteTable('relationship_type_roles', {
  ...commonColumns(),
  relationshipTypeId: integer('relationship_type_id').notNull().references(() => relationshipTypes.id, { onDelete: 'no action', }),
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  roleOrder: integer('role_order').notNull().default(0),
  requiredYn: text('required_yn', {
    enum: [
      'Y',
      'N',
    ],
  }).notNull().default('Y'),
}, table => [
  uniqueIndex('uq_relationship_roles_order').on(table.relationshipTypeId, table.roleOrder),
  uniqueIndex('uq_relationship_roles_name').on(table.relationshipTypeId, table.name),
  index('idx_relationship_roles_required').on(table.relationshipTypeId, table.requiredYn),
  check('ck_relationship_type_roles_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_relationship_type_roles_del_yn', sql`${table.delYn} in ('Y', 'N')`),
  check('ck_relationship_type_roles_required_yn', sql`${table.requiredYn} in ('Y', 'N')`),
]);
