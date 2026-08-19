import { bigint, pgTable, unique } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';
import { worlds } from './worlds.table';

export const worldAdmins = pgTable('world_admins', {
  ...commonColumns(() => admins.id),
  worldId: bigint('world_id', { mode: 'number', })
    .notNull()
    .references(() => worlds.id, { onDelete: 'no action', }),
  adminId: bigint('admin_id', { mode: 'number', })
    .notNull()
    .references(() => admins.id, { onDelete: 'no action', }),
}, table => [
  unique('uq_world_admins_world_id_admin_id')
    .on(table.worldId, table.adminId),
]);
