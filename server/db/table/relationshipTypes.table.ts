import { bigint, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';
import { worlds } from './worlds.table';

export const relationshipTypes = pgTable('relationship_types', {
  ...commonColumns(() => admins.id),
  worldId: bigint('world_id', { mode: 'number', })
    .references(() => worlds.id, { onDelete: 'no action', }),
  name: varchar('name')
    .notNull(),
  reverseName: varchar('reverse_name'),
  directionType: varchar('direction_type', {
    enum: [
      'DIRECTED',
      'SYMMETRIC',
    ],
  })
    .notNull(),
  displayTemplate: text('display_template')
    .notNull(),
  defaultYn: varchar('default_yn', { length: 1, })
    .notNull()
    .default('N'),
});
