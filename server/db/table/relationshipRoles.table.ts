import { sql } from 'drizzle-orm';
import { bigint, check, pgTable, smallint, unique, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonChecks, commonColumns, ynCheck } from './common.columns';
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
  requiredYn: varchar('required_yn', { length: 1, })
    .notNull()
    .default('Y'),
}, table => [
  unique('uq_relationship_roles_relationship_type_id_name')
    .on(table.relationshipTypeId, table.name),
  unique('uq_relationship_roles_relationship_type_id_sort_order')
    .on(table.relationshipTypeId, table.sortOrder),
  ...commonChecks('relationship_roles', table.useYn, table.delYn),
  ynCheck('ck_relationship_roles_required_yn', table.requiredYn),
  check('ck_relationship_roles_sort_order', sql`${table.sortOrder} between 1 and 4`),
]);
