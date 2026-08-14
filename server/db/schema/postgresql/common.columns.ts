import {
  bigint,
  bigserial,
  char,
  timestamp,
} from 'drizzle-orm/pg-core';
import { admins } from './admins.table';

export const commonColumns = () => ({
  id: bigserial('id', { mode: 'number', }).primaryKey(),
  useYn: char('use_yn', {
    length: 1,
    enum: [
      'Y',
      'N',
    ],
  }).notNull().default('Y'),
  delYn: char('del_yn', {
    length: 1,
    enum: [
      'Y',
      'N',
    ],
  }).notNull().default('N'),
  createId: bigint('create_id', { mode: 'number', }).references(() => admins.id, { onDelete: 'no action', }),
  updateId: bigint('update_id', { mode: 'number', }).references(() => admins.id, { onDelete: 'no action', }),
  deleteId: bigint('delete_id', { mode: 'number', }).references(() => admins.id, { onDelete: 'no action', }),
  createDate: timestamp('create_date', { withTimezone: true, }).notNull().defaultNow(),
  updateDate: timestamp('update_date', { withTimezone: true, }).notNull().defaultNow(),
  deleteDate: timestamp('delete_date', { withTimezone: true, }),
});
