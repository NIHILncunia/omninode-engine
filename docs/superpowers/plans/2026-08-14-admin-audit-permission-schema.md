# 관리자 감사·권한 스키마 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 도메인 테이블에 관리자 감사 식별자를 추가하고, 관리자별 YN 권한 설정을 위한 `permissions`와 `adminPermissions`를 제공한다.

**Architecture:** `commonColumns`가 `createId`, `updateId`, `deleteId`를 모든 테이블에 제공하되 순환 참조를 피하기 위해 공통 컬럼 자체에서는 FK를 선언하지 않는다. 각 테이블의 방언별 선언은 이 세 컬럼을 `admins.id`에 연결하는 외래키를 명시한다. 권한은 전역 코드 마스터와 관리자별 단일 YN 행으로 분리한다.

**Tech Stack:** Nuxt 4, TypeScript, Drizzle ORM 0.45, Drizzle Kit 0.31, SQLite, PostgreSQL, Vitest 4.

## Global Constraints

- 기존 18개 테이블과 새 `permissions`, `admin_permissions`는 `id`, `useYn`, `delYn`, `createId`, `updateId`, `deleteId`, `createDate`, `updateDate`, `deleteDate`를 가진다.
- `createId`, `updateId`, `deleteId`는 nullable이며 `admins.id`를 `ON DELETE NO ACTION`으로 참조한다.
- `admins.createdByAdminId`와 `lastLoginDate`는 남기지 않는다.
- `admins`에는 `lastSignInDate`, `passwordChangeRequiredDate`를 둔다.
- 권한은 `Y`, `N`만 허용하는 `adminPermissions.grantYn`으로 저장하며 `(adminId, permissionId)`는 고유하다.
- 개발 SQLite 데이터베이스는 재생성한다. 운영 PostgreSQL에는 연결하거나 적용하지 않는다.

---

### Task 1: 변경된 스키마 계약을 실패하는 테스트로 고정

**Files:**
- Modify: `test/database-schema.test.ts`

**Interfaces:**
- Consumes: 두 방언의 schema index named export
- Produces: 20개 테이블, 감사 컬럼, admins rename, 권한 FK·YN·UNIQUE 계약

- [ ] **Step 1: 새 테이블과 감사 컬럼을 기대하는 테스트를 추가한다.**

```ts
const tableNames = {
  // existing 18 tables
  permissions: 'permissions',
  adminPermissions: 'admin_permissions',
} as const;

const auditColumnKeys = [
  'createId', 'updateId', 'deleteId',
] as const;

for (const tableName of Object.keys(tableNames)) {
  expect(Object.keys(schema[tableName])).toEqual(expect.arrayContaining(auditColumnKeys));
}
```

- [ ] **Step 2: admins와 권한 테이블의 원하는 계약을 추가한다.**

```ts
expect(sqliteSchema.admins).toHaveProperty('lastSignInDate');
expect(sqliteSchema.admins).toHaveProperty('passwordChangeRequiredDate');
expect(sqliteSchema.admins).not.toHaveProperty('createdByAdminId');
expect(sqliteSchema.admins).not.toHaveProperty('lastLoginDate');
expect(sqliteSchema.adminPermissions.grantYn.default).toBe('Y');
```

- [ ] **Step 3: 대상 테스트가 현재 스키마 부재로 실패하는지 확인한다.**

Run: `pnpm exec vitest run test/database-schema.test.ts`

Expected: `permissions` 또는 `createId` export/컬럼 부재로 FAIL.

### Task 2: SQLite 감사·권한 스키마 구현

**Files:**
- Create: `server/db/schema/sqlite/permissions.table.ts`
- Create: `server/db/schema/sqlite/adminPermissions.table.ts`
- Modify: `server/db/schema/sqlite/common.columns.ts`
- Modify: `server/db/schema/sqlite/admins.table.ts`
- Modify: `server/db/schema/sqlite/index.ts`
- Modify: 기존 SQLite `*.table.ts` 17개
- Test: `test/database-schema.test.ts`

**Interfaces:**
- Consumes: Task 1의 SQLite 계약
- Produces: 20개 SQLite table export 및 모든 감사 FK

- [ ] **Step 1: `commonColumns`에 nullable 식별자 열을 선언한다.**

```ts
createId: integer('create_id'),
updateId: integer('update_id'),
deleteId: integer('delete_id'),
```

- [ ] **Step 2: 각 SQLite 테이블 콜백에 세 관리자 FK를 선언한다.**

```ts
foreignKey({
  columns: [table.createId],
  foreignColumns: [admins.id],
  name: 'fk_<table>_create_id',
}).onDelete('no action'),
```

`admins`는 자체 테이블 `id`를 대상으로, 나머지는 import한 `admins.id`를 대상으로 한다. 세 개의 FK 이름은 각각 `_create_id`, `_update_id`, `_delete_id` 접미사를 사용한다.

- [ ] **Step 3: SQLite admins의 기존 생성자·로그인 컬럼을 교체한다.**

```ts
passwordChangeRequiredDate: integer('password_change_required_date', { mode: 'timestamp_ms', }),
lastSignInDate: integer('last_sign_in_date', { mode: 'timestamp_ms', }),
```

`createdByAdminId` 선언과 `idx_admins_created_by`를 제거한다.

- [ ] **Step 4: SQLite 권한 테이블 두 개를 구현하고 index에서 export한다.**

```ts
export const permissions = sqliteTable('permissions', {
  ...commonColumns(),
  code: text('code').notNull(),
  name: text('name').notNull(),
}, table => [uniqueIndex('uq_permissions_code').on(table.code)]);

export const adminPermissions = sqliteTable('admin_permissions', {
  ...commonColumns(),
  adminId: integer('admin_id').notNull().references(() => admins.id, { onDelete: 'no action', }),
  permissionId: integer('permission_id').notNull().references(() => permissions.id, { onDelete: 'no action', }),
  grantYn: text('grant_yn', { enum: ['Y', 'N'] }).notNull().default('Y'),
}, table => [uniqueIndex('uq_admin_permissions_admin_permission').on(table.adminId, table.permissionId)]);
```

추가 공통 감사 FK와 `grantYn` CHECK도 선언한다.

- [ ] **Step 5: 대상 테스트가 SQLite 계약을 통과하는지 확인한다.**

Run: `pnpm exec vitest run test/database-schema.test.ts`

Expected: PostgreSQL 미구현 부분만 실패하고 SQLite 계약은 PASS.

### Task 3: PostgreSQL 감사·권한 스키마 구현

**Files:**
- Create: `server/db/schema/postgresql/permissions.table.ts`
- Create: `server/db/schema/postgresql/adminPermissions.table.ts`
- Modify: `server/db/schema/postgresql/common.columns.ts`
- Modify: `server/db/schema/postgresql/admins.table.ts`
- Modify: `server/db/schema/postgresql/index.ts`
- Modify: 기존 PostgreSQL `*.table.ts` 17개
- Test: `test/database-schema.test.ts`

**Interfaces:**
- Consumes: Task 1의 PostgreSQL 계약
- Produces: 20개 PostgreSQL table export 및 SQLite와 같은 감사 의미

- [ ] **Step 1: `commonColumns`에 nullable bigint 감사 컬럼을 선언한다.**

```ts
createId: bigint('create_id', { mode: 'number', }),
updateId: bigint('update_id', { mode: 'number', }),
deleteId: bigint('delete_id', { mode: 'number', }),
```

- [ ] **Step 2: 모든 PostgreSQL 테이블에 세 관리자 FK를 선언한다.**

SQLite와 동일한 이름 규칙과 `ON DELETE NO ACTION`을 사용한다.

- [ ] **Step 3: PostgreSQL admins의 컬럼 이름을 교체한다.**

```ts
passwordChangeRequiredDate: timestamp('password_change_required_date', { withTimezone: true, }),
lastSignInDate: timestamp('last_sign_in_date', { withTimezone: true, }),
```

`createdByAdminId`와 그 인덱스를 제거한다.

- [ ] **Step 4: PostgreSQL permissions와 adminPermissions를 구현해 index에서 export한다.**

`permissions.code`는 varchar(100) UNIQUE, `permissions.name`은 varchar(200), `adminPermissions.grantYn`은 char(1) 기본 `Y`와 CHECK를 사용한다. `(adminId, permissionId)` 고유 인덱스와 두 대상 FK, 공통 감사 FK를 선언한다.

- [ ] **Step 5: 대상 스키마 계약 전체가 통과하는지 확인한다.**

Run: `pnpm exec vitest run test/database-schema.test.ts`

Expected: PASS.

### Task 4: 개발 SQLite DB를 새 스키마로 재생성하고 검증

**Files:**
- Modify: `test/database-schema.test.ts` (필요한 SQLite 메타데이터 검증만 추가)
- Regenerate: `data/omninode.dev.db` (gitignored)

**Interfaces:**
- Consumes: Tasks 2-3 schema index
- Produces: 20개 테이블과 새 감사·권한 컬럼을 가진 로컬 개발 DB

- [ ] **Step 1: 개발 DB 파일을 삭제하기 전에 대상이 gitignored 개발 DB인지 확인한다.**

Run: `git check-ignore data/omninode.dev.db && Test-Path data/omninode.dev.db`

Expected: ignore 규칙과 파일 존재를 확인.

- [ ] **Step 2: 검증된 개발 DB 파일만 제거한다.**

Run: `Remove-Item -LiteralPath 'data/omninode.dev.db'`

- [ ] **Step 3: Drizzle push로 새 SQLite DB를 만든다.**

Run: `pnpm db:dev:push`

Expected: `Changes applied` 및 `data/omninode.dev.db` 생성.

- [ ] **Step 4: SQLite 메타데이터를 조회한다.**

Run: `node --input-type=module -` with `better-sqlite3` to query `sqlite_master`, `pragma table_info('admins')`, `pragma table_info('admin_permissions')`.

Expected: 20개 사용자 테이블, admins의 `last_sign_in_date`·`password_change_required_date`, admin_permissions의 `grant_yn`, 모든 테이블의 `create_id`·`update_id`·`delete_id`.

- [ ] **Step 5: 최종 검증을 실행한다.**

Run: `pnpm exec vitest run test/database-schema.test.ts; pnpm exec vue-tsc --noEmit; pnpm build; git diff --check`

Expected: 대상 스키마 테스트·타입 검사·빌드·공백 검사가 통과한다. 기존 무관한 전체 테스트 실패는 별도로 기록한다.

## 계획 자체 점검

- 모든 20개 테이블의 공통 감사 컬럼은 Tasks 2와 3에서 다룬다.
- 관리자 이름 변경과 비밀번호 변경 요구 시각은 Tasks 2와 3에서 다룬다.
- 권한 마스터와 `adminPermissions.grantYn`은 Tasks 2와 3에서 다룬다.
- 개발 SQLite DB 재생성과 실제 구조 검증은 Task 4에서 다룬다.
