import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';

export const worlds = pgTable('worlds', {
  ...commonColumns(() => admins.id),
  name: varchar('name')
    .notNull(),
});
