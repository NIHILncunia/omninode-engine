import { sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { bigserial, bigint, char, check, timestamp } from 'drizzle-orm/pg-core';

const auditIdColumn = (name: string, getAdminId?: () => AnyPgColumn) => {
  const column = bigint(name, { mode: 'number', });

  return getAdminId ? column.references(getAdminId, { onDelete: 'no action', }) : column;
};

export const commonColumns = (getAdminId?: () => AnyPgColumn) => ({
  id: bigserial('id', { mode: 'number', })
    .primaryKey(),
  useYn: char('use_yn', { length: 1, })
    .notNull()
    .default('Y'),
  delYn: char('del_yn', { length: 1, })
    .notNull()
    .default('N'),
  createId: auditIdColumn('create_id', getAdminId),
  createDate: timestamp('create_date', { withTimezone: true, })
    .notNull().defaultNow(),
  updateId: auditIdColumn('update_id', getAdminId),
  updateDate: timestamp('update_date', { withTimezone: true, }),
  deleteId: auditIdColumn('delete_id', getAdminId),
  deleteDate: timestamp('delete_date', { withTimezone: true, }),
});

export const commonChecks = (tableName: string, useYn: AnyPgColumn, delYn: AnyPgColumn) => [
  check(`ck_${tableName}_use_yn`, sql`${useYn} in ('Y', 'N')`),
  check(`ck_${tableName}_del_yn`, sql`${delYn} in ('Y', 'N')`),
];

export const ynCheck = (name: string, column: AnyPgColumn) => check(name, sql`${column} in ('Y', 'N')`);
