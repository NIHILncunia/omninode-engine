import {
  bigserial,
  char,
  timestamp,
} from 'drizzle-orm/pg-core';

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
  createDate: timestamp('create_date', { withTimezone: true, }).notNull().defaultNow(),
  updateDate: timestamp('update_date', { withTimezone: true, }).notNull().defaultNow(),
  deleteDate: timestamp('delete_date', { withTimezone: true, }),
});
