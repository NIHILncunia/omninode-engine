import { sql } from 'drizzle-orm';
import { bigint, check, pgTable, smallint, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';
import { relationshipTypes } from './relationshipTypes.table';

export const relationshipRoles = pgTable('relationship_roles', {
  ...commonColumns(() => admins.id),
  relationshipTypeId: bigint('relationship_type_id', { mode: 'number', })
    .notNull()
    .references(() => relationshipTypes.id, { onDelete: 'no action', }),
  name: varchar('name')
    .notNull(),
  sortOrder: smallint('sort_order')
    .notNull(),
  requiredYn: varchar('required_yn', {
    enum: [
      'Y',
      'N',
    ],
    length: 1,
  })
    .notNull()
    .default('Y'),
}, table => [
  uniqueIndex('uq_relationship_roles_relationship_type_id_name_active')
    .on(table.relationshipTypeId, table.name)
    .where(sql`${table.delYn} = 'N'`),
  uniqueIndex('uq_relationship_roles_relationship_type_id_sort_order_active')
    .on(table.relationshipTypeId, table.sortOrder)
    .where(sql`${table.delYn} = 'N'`),
  check('ck_relationship_roles_sort_order', sql`${table.sortOrder} between 1 and 4`),
]);
