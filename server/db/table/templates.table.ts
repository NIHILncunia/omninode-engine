import { bigint, pgTable, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonChecks, commonColumns, ynCheck } from './common.columns';
import { worlds } from './worlds.table';

export const templates = pgTable('templates', {
  ...commonColumns(() => admins.id),
  worldId: bigint('world_id', { mode: 'number', })
    .references(() => worlds.id, { onDelete: 'no action', }),
  name: varchar('name')
    .notNull(),
  defaultYn: varchar('default_yn', { length: 1, })
    .notNull()
    .default('N'),
}, table => [
  ...commonChecks('templates', table.useYn, table.delYn),
  ynCheck('ck_templates_default_yn', table.defaultYn),
]);
