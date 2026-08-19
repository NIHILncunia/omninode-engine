import { bigint, pgTable, smallint, unique, varchar } from 'drizzle-orm/pg-core';
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
  requiredYn: varchar('required_yn', { length: 1, })
    .notNull()
    .default('Y'),
}, table => [
  unique('uq_relationship_roles_relationship_type_id_name')
    .on(table.relationshipTypeId, table.name),
  unique('uq_relationship_roles_relationship_type_id_sort_order')
    .on(table.relationshipTypeId, table.sortOrder),
]);
