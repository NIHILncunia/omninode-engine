import { sql } from 'drizzle-orm';
import { bigint, char, check, index, integer, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { commonColumns } from './common.columns';
import { relationshipTypes } from './relationshipTypes.table';

export const relationshipTypeRoles = pgTable('relationship_type_roles', {
  ...commonColumns(),
  relationshipTypeId: bigint('relationship_type_id', { mode: 'number', }).notNull().references(() => relationshipTypes.id, { onDelete: 'no action', }),
  name: varchar('name', { length: 200, }).notNull(),
  displayName: varchar('display_name', { length: 300, }).notNull(),
  roleOrder: integer('role_order').notNull().default(0),
  requiredYn: char('required_yn', {
    length: 1,
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
