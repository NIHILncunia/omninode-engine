import { boolean, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const exampleItems = pgTable('example_items', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
