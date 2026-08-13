import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { admins } from './admins.table';
import { commonColumns } from './common.columns';

export const adminRefreshTokens = sqliteTable('admin_refresh_tokens', {
  ...commonColumns(),
  adminId: integer('admin_id').notNull().references(() => admins.id, { onDelete: 'no action', }),
  tokenHash: text('token_hash').notNull(),
  expiresDate: integer('expires_date', { mode: 'timestamp_ms', }).notNull(),
  revokedYn: text('revoked_yn', {
    enum: [
      'Y',
      'N',
    ],
  }).notNull().default('N'),
  revokedDate: integer('revoked_date', { mode: 'timestamp_ms', }),
  deviceInfo: text('device_info'),
}, table => [
  uniqueIndex('uq_admin_refresh_tokens_hash').on(table.tokenHash),
  index('idx_admin_refresh_tokens_admin').on(table.adminId),
  index('idx_admin_refresh_tokens_expire').on(table.expiresDate),
  index('idx_admin_refresh_tokens_status').on(table.adminId, table.revokedYn, table.delYn),
  check('ck_admin_refresh_tokens_use_yn', sql`${table.useYn} in ('Y', 'N')`),
  check('ck_admin_refresh_tokens_del_yn', sql`${table.delYn} in ('Y', 'N')`),
  check('ck_admin_refresh_tokens_revoked_yn', sql`${table.revokedYn} in ('Y', 'N')`),
]);
