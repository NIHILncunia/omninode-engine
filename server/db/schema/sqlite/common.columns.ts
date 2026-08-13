import { sql } from 'drizzle-orm';
import {
  integer,
  text,
} from 'drizzle-orm/sqlite-core';

export const commonColumns = () => ({
  id: integer('id').primaryKey({ autoIncrement: true, }),
  useYn: text('use_yn', {
    enum: [
      'Y',
      'N',
    ],
  }).notNull().default('Y'),
  delYn: text('del_yn', {
    enum: [
      'Y',
      'N',
    ],
  }).notNull().default('N'),
  createDate: integer('create_date', { mode: 'timestamp_ms', }).notNull().default(sql`(unixepoch() * 1000)`),
  updateDate: integer('update_date', { mode: 'timestamp_ms', }).notNull().default(sql`(unixepoch() * 1000)`),
  deleteDate: integer('delete_date', { mode: 'timestamp_ms', }),
});
