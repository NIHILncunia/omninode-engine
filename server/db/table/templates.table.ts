import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';

export const templates = pgTable('templates', {
  ...commonColumns(() => admins.id),
  name: varchar('name')
    .notNull(),
  defaultYn: varchar('default_yn', {
    enum: [
      'Y',
      'N',
    ],
    length: 1,
  })
    .notNull()
    .default('N'),
});
