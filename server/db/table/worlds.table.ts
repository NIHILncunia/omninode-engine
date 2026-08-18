import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonChecks, commonColumns } from './common.columns';

export const worlds = pgTable('worlds', {
  ...commonColumns(() => admins.id),
  name: varchar('name')
    .notNull(),
}, table => commonChecks('worlds', table.useYn, table.delYn));
