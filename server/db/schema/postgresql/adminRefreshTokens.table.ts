import { sql } from 'drizzle-orm';
import { bigint, char, check, index, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';

export const adminRefreshTokens = pgTable('admin_refresh_tokens', {
  ...commonColumns(),
  adminId: bigint('admin_id', { mode: 'number', }).notNull().references(() => admins.id, { onDelete: 'no action', }),
  tokenHash: varchar('token_hash', { length: 255, }).notNull(),
  expiresDate: timestamp('expires_date', { withTimezone: true, }).notNull(),
  revokedYn: char('revoked_yn', {
    length: 1,
    enum: [
      'Y',
      'N',
    ],
  }).notNull().default('N'),
  revokedDate: timestamp('revoked_date', { withTimezone: true, }),
  deviceInfo: varchar('device_info', { length: 500, }),
}, table => [
  uniqueIndex('uq_admin_refresh_tokens_hash').on(table.tokenHash),
  index('idx_admin_refresh_tokens_admin').on(table.adminId),
  index('idx_admin_refresh_tokens_expire').on(table.expiresDate),
  index('idx_admin_refresh_tokens_status').on(table.adminId, table.revokedYn, table.delYn),
  check('ck_admin_refresh_tokens_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_admin_refresh_tokens_del_yn', sql`${table.delYn} in ('Y', 'N')`),
  check('ck_admin_refresh_tokens_revoked_yn', sql`${table.revokedYn} in ('Y', 'N')`),
]);
