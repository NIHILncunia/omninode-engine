import { sql } from 'drizzle-orm';
import { bigint, char, check, index, integer, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';

export const relationshipTypes = pgTable('relationship_types', {
  ...commonColumns(),
  ownerAdminId: bigint('owner_admin_id', { mode: 'number', }).references(() => admins.id, { onDelete: 'no action', }),
  name: varchar('name', { length: 300, }).notNull(),
  description: text('description'),
  systemYn: char('system_yn', {
    length: 1,
    enum: [
      'Y',
      'N',
    ],
  }).notNull().default('N'),
  minTargetCount: integer('min_target_count').notNull().default(2),
  maxTargetCount: integer('max_target_count').notNull().default(2),
}, table => [
  uniqueIndex('uq_relationship_types_system_name').on(table.systemYn, table.name).where(sql`${table.systemYn} = 'Y'`),
  uniqueIndex('uq_relationship_types_owner_name').on(table.ownerAdminId, table.name).where(sql`${table.systemYn} = 'N'`),
  index('idx_relationship_types_owner').on(table.ownerAdminId),
  index('idx_relationship_types_system').on(table.systemYn),
  check('ck_relationship_types_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_relationship_types_del_yn', sql`${table.delYn} in ('Y', 'N')`),
  check('ck_relationship_types_system_yn', sql`${table.systemYn} in ('Y', 'N')`),
  check('ck_relationship_types_owner', sql`(${table.systemYn} = 'Y' and ${table.ownerAdminId} is null) or (${table.systemYn} = 'N' and ${table.ownerAdminId} is not null)`),
  check('ck_relationship_types_count', sql`${table.minTargetCount} >= 2 and ${table.maxTargetCount} >= ${table.minTargetCount}`),
]);
