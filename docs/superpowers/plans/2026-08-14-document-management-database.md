# 문서 관리 시스템 데이터베이스 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SQLite 개발 환경과 PostgreSQL 운영 환경에 동일한 18개 테이블의 Omninode 데이터 모델을 Drizzle 스키마와 마이그레이션으로 제공한다.

**Architecture:** 두 방언의 `index.ts`는 동일한 camelCase TypeScript 테이블 export·속성 key와 snake_case 물리 테이블·컬럼명, 관계·제약을 독립 선언한다. 인덱스와 CHECK 제약 이름은 기존 snake_case를 유지한다. 순환 참조, 부분·표현식 인덱스, 전문 검색처럼 Drizzle 테이블 선언만으로 완결되지 않는 DBMS 차이는 생성 마이그레이션에 명시 SQL을 추가해 해결한다. 행 간 또는 권한 기반 제약은 스키마에 억지로 넣지 않고 이후 서버 서비스 트랜잭션의 책임으로 남긴다.

**Tech Stack:** Nuxt 4, TypeScript, Drizzle ORM 0.45, Drizzle Kit 0.31, SQLite, PostgreSQL, Vitest 4.

## Global Constraints

- DB 물리 테이블명과 컬럼명은 snake_case를 사용하고, Drizzle TypeScript 테이블 export와 속성 key만 camelCase를 사용한다. 인덱스와 CHECK 제약 이름은 기존 snake_case를 유지한다.
- 모든 테이블은 `id`, `useYn`, `delYn`, `createDate`, `updateDate`, `deleteDate` 공통 컬럼을 가진다.
- 모든 YN 컬럼은 `Y`와 `N`만 허용하고, 외래키는 `ON DELETE NO ACTION`을 사용한다.
- 문서 본문의 유일한 영구 정본은 `documents.content`이며, 섹션별 콘텐츠 컬럼은 만들지 않는다.
- 소프트 삭제 데이터도 이름 고유성 검사에 포함한다. 같은 이름 생성은 서비스가 기존 행을 복구한다.
- 권한, 동일 월드 검증, 트리 부모·자식 검증, 관계 역할·카테고리 호환성은 후속 서비스 트랜잭션에서 검증한다.
- 구현 중 기존 사용자의 변경 파일을 되돌리거나 수정하지 않는다.

---

## 파일 구조

- `test/database-schema.test.ts`: 두 방언의 18개 테이블·핵심 컬럼·문서 본문 단일 정본·핵심 인덱스 선언을 검사한다.
- `server/db/schema/sqlite/<tableName>.table.ts`: SQLite의 테이블 하나와 해당 FK, CHECK, UNIQUE, 인덱스를 선언한다.
- `server/db/schema/sqlite/index.ts`: SQLite 테이블 파일의 named export만 다시 내보낸다.
- `server/db/schema/postgresql/<tableName>.table.ts`: PostgreSQL의 테이블 하나와 해당 FK, CHECK, UNIQUE, 인덱스를 선언한다.
- `server/db/schema/postgresql/index.ts`: PostgreSQL 테이블 파일의 named export만 다시 내보낸다.
- `server/db/migrations/sqlite/`: Drizzle Kit가 생성하는 초기 스키마 SQL과 SQLite FTS5 보조 SQL을 둔다.
- `server/db/migrations/postgresql/`: Drizzle Kit가 생성하는 초기 스키마 SQL과 PostgreSQL GIN 보조 SQL을 둔다.

### Task 1: 스키마 구조 계약 테스트

**Files:**
- Create: `test/database-schema.test.ts`

**Interfaces:**
- Consumes: `server/db/schema/sqlite/index.ts`와 `server/db/schema/postgresql/index.ts`가 named table export를 제공한다.
- Produces: `pnpm test -- test/database-schema.test.ts`로 실행할 수 있는 방언 공통 스키마 계약 검증.

- [ ] **Step 1: 실패하는 구조 계약 테스트를 작성한다**

```ts
import * as postgresqlSchema from '../server/db/schema/postgresql';
import * as sqliteSchema from '../server/db/schema/sqlite';
import { describe, expect, it } from 'vitest';

const tableNames = [
  'admins', 'adminRefreshTokens', 'projectAdmins', 'projects', 'worlds',
  'categories', 'templates', 'sections', 'templateSections', 'documents',
  'documentCategories', 'documentSections', 'relationshipTypes',
  'relationshipTypeRoles', 'worldRelationshipTypes',
  'worldRelationshipRoleCategories', 'documentRelationships',
  'documentRelationshipTargets',
] as const;

describe.each([
  ['SQLite', sqliteSchema],
  ['PostgreSQL', postgresqlSchema],
])('%s 문서 관리 스키마', (_dialect, schema) => {
  it('명세의 18개 테이블을 모두 내보낸다', () => {
    for (const tableName of tableNames) expect(schema).toHaveProperty(tableName);
  });

  it('모든 테이블이 공통 컬럼을 가진다', () => {
    for (const tableName of tableNames) {
      const table = schema[tableName];
      expect(Object.keys(table)).toEqual(expect.arrayContaining([
        'id', 'useYn', 'delYn', 'createDate', 'updateDate', 'deleteDate',
      ]));
    }
  });

  it('문서 본문을 documents.content 하나로 선언한다', () => {
    expect(schema.documents).toHaveProperty('content');
    expect(Object.keys(schema.documentSections)).not.toContain('content');
  });
});
```

- [ ] **Step 2: 테스트가 올바르게 실패하는지 확인한다**

Run: `pnpm test -- test/database-schema.test.ts`

Expected: FAIL. 빈 스키마 모듈에 18개 export가 없어야 한다.

- [ ] **Step 3: 실패 원인을 기록하고 테스트 파일만 유지한다**

`server/db/schema/*/index.ts`는 아직 빈 모듈이므로 import 또는 export 부재로 실패해야 한다. 테스트를 구현에 맞춰 약화시키지 않는다.

- [ ] **Step 4: 테스트 파일의 형식만 확인한다**

Run: `pnpm exec eslint test/database-schema.test.ts`

Expected: PASS 또는 기존 ESLint 도구 체인 문제만 보고한다.

### Task 2: SQLite 18개 테이블과 제약 선언

**Files:**
- Create: `server/db/schema/sqlite/<tableName>.table.ts` 18개
- Modify: `server/db/schema/sqlite/index.ts`
- Test: `test/database-schema.test.ts`

**Interfaces:**
- Consumes: Task 1의 `tableNames` 및 공통 컬럼 계약.
- Produces: 18개 named export와 SQLite용 `sqliteTable` 정의.

- [ ] **Step 1: SQLite 스키마 계약 테스트를 실행해 실패 상태를 다시 확인한다**

Run: `pnpm test -- test/database-schema.test.ts`

Expected: FAIL. `sqliteSchema`에 `admins` 등이 없다.

- [ ] **Step 2: 공통 열 생성기와 기본 테이블을 선언한다**

`sqlite-core`의 `integer`, `text`, `sqliteTable`, `index`, `uniqueIndex`, `check`, `foreignKey`와 `drizzle-orm`의 `sql`을 가져온다. 각 테이블에 아래와 같은 공통 열을 반복 선언한다.

```ts
id: integer('id').primaryKey({ autoIncrement: true }),
useYn: text('useYn', { enum: ['Y', 'N'] }).notNull().default('Y'),
delYn: text('delYn', { enum: ['Y', 'N'] }).notNull().default('N'),
createDate: integer('createDate', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
updateDate: integer('updateDate', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
deleteDate: integer('deleteDate', { mode: 'timestamp_ms' }),
```

`admins`, `adminRefreshTokens`, `projects`, `worlds`, `templates`, `sections`, `documents`, `relationshipTypes`, `documentRelationships`를 먼저 선언하고, 참조 테이블은 그 뒤에 선언한다. 모든 FK에는 `.references(() => target.id, { onDelete: 'no action' })`를 사용한다.

- [ ] **Step 3: 나머지 연결 테이블과 모든 고유성·CHECK·조회 인덱스를 선언한다**

`projectAdmins`, `categories`, `templateSections`, `documentCategories`, `documentSections`, `relationshipTypeRoles`, `worldRelationshipTypes`, `worldRelationshipRoleCategories`, `documentRelationshipTargets`를 선언한다. 다음 제약을 반드시 포함한다.

```ts
check('ck_categories_level', sql`${table.level} between 1 and 3`),
check('ck_templates_version', sql`${table.version} >= 1`),
check('ck_sections_level', sql`${table.level} between 1 and 6`),
check('ck_relationship_types_count', sql`${table.minTargetCount} >= 2 and ${table.maxTargetCount} >= ${table.minTargetCount}`),
uniqueIndex('uq_document_categories_level').on(table.documentId, table.level),
uniqueIndex('uq_document_relationship_targets_document').on(table.documentRelationshipId, table.documentId),
index('idx_documents_status').on(table.worldId, table.useYn, table.delYn),
```

카테고리의 최상위 이름 고유성과 시스템·사용자 관계 이름 고유성은 SQLite 표현식/부분 UNIQUE 인덱스로 선언한다. `documents`에는 제목과 내용의 일반 복합 인덱스를 두지 않고 FTS5 마이그레이션에서 전문 검색을 담당하게 한다.

- [ ] **Step 4: 구조 테스트가 통과하는지 확인한다**

Run: `pnpm test -- test/database-schema.test.ts`

Expected: PostgreSQL export가 아직 없으므로 전체는 FAIL하되 SQLite 행 세 개는 PASS가 된다.

- [ ] **Step 5: SQLite 스키마 타입을 검사한다**

Run: `pnpm exec vue-tsc --noEmit`

Expected: SQLite 스키마의 Drizzle 타입 오류가 없다.

### Task 3: PostgreSQL 18개 테이블과 제약 선언

**Files:**
- Create: `server/db/schema/postgresql/<tableName>.table.ts` 18개
- Modify: `server/db/schema/postgresql/index.ts`
- Test: `test/database-schema.test.ts`

**Interfaces:**
- Consumes: Task 1의 named exports, Task 2에서 확정한 동일 테이블·컬럼 계약.
- Produces: 18개 named export와 PostgreSQL용 `pgTable` 정의.

- [ ] **Step 1: PostgreSQL 계약 테스트가 실패하는지 확인한다**

Run: `pnpm test -- test/database-schema.test.ts`

Expected: PostgreSQL 모듈에 `admins` 등이 없어 FAIL, SQLite 검사는 PASS.

- [ ] **Step 2: PostgreSQL 기본 테이블을 선언한다**

`pg-core`의 `bigserial`, `bigint`, `varchar`, `text`, `char`, `integer`, `timestamp`, `pgTable`, `index`, `uniqueIndex`, `check`와 `drizzle-orm`의 `sql`을 가져온다. 각 테이블에 아래 공통 열을 선언한다.

```ts
id: bigserial('id', { mode: 'number' }).primaryKey(),
useYn: char('useYn', { length: 1 }).notNull().default('Y'),
delYn: char('delYn', { length: 1 }).notNull().default('N'),
createDate: timestamp('createDate', { withTimezone: true }).notNull().defaultNow(),
updateDate: timestamp('updateDate', { withTimezone: true }).notNull().defaultNow(),
deleteDate: timestamp('deleteDate', { withTimezone: true }),
```

Task 2와 동일한 선언 순서·FK 의미·컬럼 NULL 정책·고유성·CHECK·상태 인덱스를 사용한다. PostgreSQL `content`는 `text('content')`로 선언한다.

- [ ] **Step 3: PostgreSQL 전용 인덱스를 선언한다**

`categories`에는 `COALESCE(upperCategoryId, 0)` 표현식 UNIQUE 인덱스를, `relationshipTypes`에는 아래 부분 UNIQUE 인덱스를 선언한다.

```ts
uniqueIndex('uq_relationship_types_system_name')
  .on(table.systemYn, table.name)
  .where(sql`${table.systemYn} = 'Y'`),
uniqueIndex('uq_relationship_types_owner_name')
  .on(table.ownerAdminId, table.name)
  .where(sql`${table.systemYn} = 'N'`),
```

`documents`의 GIN 전문 검색은 Task 4 마이그레이션 SQL로 만들므로 일반 Drizzle 인덱스로 대체하지 않는다.

- [ ] **Step 4: 전체 구조 테스트를 통과시킨다**

Run: `pnpm test -- test/database-schema.test.ts`

Expected: PASS. 두 방언 모두 18개 테이블·공통 컬럼·문서 본문 단일 정본 계약을 만족한다.

- [ ] **Step 5: TypeScript 타입을 확인한다**

Run: `pnpm exec vue-tsc --noEmit`

Expected: PASS. 두 Drizzle 스키마에서 타입 오류가 없다.

### Task 4: DBMS별 전문 검색 마이그레이션과 Drizzle 생성 결과

**Files:**
- Create: `server/db/migrations/sqlite/` 아래 Drizzle Kit가 생성한 초기 SQL 파일
- Create: `server/db/migrations/postgresql/` 아래 Drizzle Kit가 생성한 초기 SQL 파일
- Modify: `server/db/migrations/sqlite/meta/*`
- Modify: `server/db/migrations/postgresql/meta/*`
- Test: `test/database-schema.test.ts`

**Interfaces:**
- Consumes: Task 2와 Task 3의 Drizzle schema export, `drizzle.dev.config.ts`, `drizzle.prod.config.ts`.
- Produces: 환경별 마이그레이션과 전문 검색 DDL.

- [ ] **Step 1: 마이그레이션 생성 전 전체 구조 테스트를 실행한다**

Run: `pnpm test -- test/database-schema.test.ts`

Expected: PASS.

- [ ] **Step 2: SQLite Drizzle 마이그레이션을 생성한다**

Run: `pnpm db:dev:generate`

Expected: `server/db/migrations/sqlite/`에 18개 테이블·FK·CHECK·인덱스를 생성하는 SQL과 메타데이터가 만들어진다. `.env.development`가 없으면 `.env.development.example`의 `DB_FILE_NAME=./data/omninode.dev.db`를 일시 환경 변수로 제공해 생성 명령을 실행한다.

- [ ] **Step 3: SQLite FTS5를 생성 SQL에 추가한다**

생성된 SQLite SQL 파일의 끝에 다음 DDL을 추가한다. 문서 테이블 이름과 camelCase 열 이름은 큰따옴표로 보존한다.

```sql
CREATE VIRTUAL TABLE "documentsFts" USING fts5(
  "title",
  "content",
  content='documents',
  content_rowid='id'
);
```

FTS 동기화 트리거는 문서 저장 서비스와 함께 도입한다. 이 작업에서는 실제 CRUD가 없으므로 트리거를 추측해 추가하지 않는다.

- [ ] **Step 4: PostgreSQL Drizzle 마이그레이션을 생성한다**

Run: `pnpm db:prod:generate`

Expected: `server/db/migrations/postgresql/`에 18개 테이블·FK·CHECK·인덱스를 생성하는 SQL과 메타데이터가 만들어진다. `.env.production`가 없으면 `.env.production.example`의 `DATABASE_URL`을 일시 환경 변수로 제공한다.

- [ ] **Step 5: PostgreSQL GIN 전문 검색 인덱스를 생성 SQL에 추가한다**

생성된 PostgreSQL SQL 파일의 끝에 다음 DDL을 추가한다.

```sql
CREATE INDEX "idx_documents_content" ON "documents"
USING gin (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("content", '')));
```

- [ ] **Step 6: 생성 결과와 구조 테스트를 재검증한다**

Run: `pnpm test -- test/database-schema.test.ts && pnpm exec vue-tsc --noEmit`

Expected: PASS. 생성 SQL의 테이블명은 18개 Drizzle 선언과 일치한다.

### Task 5: 전체 검증과 구현 기록

**Files:**
- Modify: `docs/superpowers/specs/2026-08-14-document-management-database-design.md`
- Test: `test/database-schema.test.ts`

**Interfaces:**
- Consumes: Tasks 1~4의 스키마·마이그레이션·검증 결과.
- Produces: 구현된 범위와 서비스 검증으로 남는 제약을 기록한 설계 문서.

- [ ] **Step 1: 전체 테스트를 실행한다**

Run: `pnpm test`

Expected: 기존 라우트 골격 테스트와 새 스키마 계약 테스트가 모두 PASS.

- [ ] **Step 2: 린트·타입 검사·빌드를 실행한다**

Run: `pnpm lint`

Expected: PASS 또는 기존 도구 체인 오류와 새 변경 파일 무관성을 분리해 기록.

Run: `pnpm exec vue-tsc --noEmit`

Expected: PASS.

Run: `pnpm build`

Expected: PASS.

- [ ] **Step 3: 설계 문서의 검증 계획을 실제 결과로 갱신한다**

`## 5. 마이그레이션과 검증 계획` 아래에 실행 날짜, 구조 테스트, Drizzle 생성, 타입 검사, 빌드 결과를 기록한다. 실패한 명령은 실패 원인과 변경 범위 관련 여부를 한 줄로 함께 기록한다.

- [ ] **Step 4: 변경 내용을 검토한다**

Run: `git diff --check && git status --short`

Expected: 공백 오류가 없고, 사용자의 기존 변경 파일은 이 작업으로 수정되지 않는다.

## 계획 자체 점검

- 명세의 18개 테이블은 Tasks 2와 3에서 각각 선언한다.
- 공통 컬럼, FK, YN·범위 CHECK, 이름 UNIQUE, 상태·정렬·관계 인덱스는 Tasks 2와 3에서 구현한다.
- SQLite FTS5와 PostgreSQL GIN 전문 검색은 Task 4에서 DBMS별 SQL로 구현한다.
- 행 간·권한·동일 월드 제약은 Global Constraints와 설계 문서에 따라 서비스 계층에 남기며, 이 초기 스키마 작업에서 허위 DB 제약으로 만들지 않는다.
- 미완성 표기가 없고, 각 테스트·명령·생성 결과가 작업별로 명시되어 있다.
