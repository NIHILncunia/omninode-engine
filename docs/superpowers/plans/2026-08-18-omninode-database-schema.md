# Omninode Database Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 옴니노드 명세의 20개 PostgreSQL Drizzle 테이블과 제약을 선언한다.

**Architecture:** 각 테이블은 `server/db/table/<domain>.table.ts`에 독립적으로 선언하고, `server/db/table/index.ts`가 named export만 재노출한다. 테이블 파일은 직접 참조하는 대상 테이블을 import하고, PostgreSQL Drizzle의 column·index·check 선언으로 명세상 DB 제약을 표현한다.

**Tech Stack:** Nuxt 4, TypeScript, Drizzle ORM, PostgreSQL, Vitest

**Spec:** `docs/superpowers/specs/2026-08-18-omninode-database-schema-design.md`

## Global Constraints

- DB 테이블·컬럼·인덱스 식별자는 `snake_case`다.
- Drizzle export와 TypeScript 속성은 `camelCase`다.
- 테이블 선언만 구현하며 migration·DB 적용·API·CRUD 쿼리는 만들지 않는다.
- 모든 테이블은 공통 감사·상태 컬럼을 가진다.
- 복수 행·복수 테이블 업무 규칙은 서비스 트랜잭션 검증 대상으로 남긴다.

---

### Task 1: 스키마 구조 계약 테스트와 설정 진입점

**Files:**
- Create: `test/database-schema.test.ts`
- Modify: `drizzle.dev.config.ts`
- Modify: `drizzle.prod.config.ts`

**Interfaces:**
- Consumes: `server/db/table/index.ts`의 named table export
- Produces: 20개 export, snake_case 물리 식별자, 명세 제약을 검증하는 Vitest 계약

- [ ] **Step 1: 실패하는 구조 계약 테스트를 작성한다.**

```ts
import * as schema from '../server/db/table';
import { getTableConfig } from 'drizzle-orm/pg-core';

const tableExports = ['admins', 'adminRequests', 'worldAdmins'] as const;

it('명세 테이블을 모두 export하고 snake_case 물리명을 사용한다', () => {
  for (const tableName of tableExports) {
    expect(schema).toHaveProperty(tableName);
    expect(getTableConfig(schema[tableName]).name).toMatch(/^[a-z]+(?:_[a-z0-9]+)*$/);
  }
});
```

- [ ] **Step 2: 테스트가 배럴 부재로 실패하는지 확인한다.**

Run: `pnpm test -- database-schema.test.ts`

Expected: FAIL because `server/db/table/index.ts` does not export the schema.

- [ ] **Step 3: 두 Drizzle 설정의 schema를 `./server/db/table/index.ts`로 지정한다.**

```ts
schema: './server/db/table/index.ts',
```

- [ ] **Step 4: 설정 파일 문법을 확인한다.**

Run: `pnpm exec drizzle-kit generate --config=drizzle.dev.config.ts --name schema-contract-check`

Expected: schema path is resolved; do not retain the generated migration directory.

### Task 2: 관리자와 월드·프로젝트 테이블

**Files:**
- Create: `server/db/table/admins.table.ts`
- Create: `server/db/table/adminRequests.table.ts`
- Create: `server/db/table/worlds.table.ts`
- Create: `server/db/table/worldAdmins.table.ts`
- Create: `server/db/table/projects.table.ts`
- Create: `server/db/table/projectAdminPermissions.table.ts`

**Interfaces:**
- Produces: `admins`, `adminRequests`, `worlds`, `worldAdmins`, `projects`, `projectAdminPermissions`
- Consumes: `admins.id` audit FKs and `worlds.id`/`projects.id` relationship FKs

- [ ] **Step 1: 관리자·월드 계약 테스트를 확장한다.**

```ts
expect(schema.admins.role.enumValues).toEqual(['SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN']);
expect(getTableConfig(schema.worldAdmins).uniqueConstraints)
  .toEqual(expect.arrayContaining([expect.objectContaining({ name: 'uq_world_admins_world_id_admin_id' })]));
```

- [ ] **Step 2: 테스트가 선언 부재로 실패하는지 확인한다.**

Run: `pnpm test -- database-schema.test.ts`

Expected: FAIL because the six tables are not exported.

- [ ] **Step 3: 각 테이블에 명세 컬럼, 공통 컬럼, FK, Y/N·역할·상태 CHECK, UNIQUE 및 부분 UNIQUE를 선언한다.**

```ts
export const admins = pgTable('admins', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  email: varchar('email').notNull(),
  password: varchar('password').notNull(),
  passwordChangedYn: char('password_changed_yn', { length: 1 }).notNull().default('N'),
}, table => [
  uniqueIndex('uq_admins_email').on(table.email),
  check('ck_admins_password_changed_yn', sql`${table.passwordChangedYn} in ('Y', 'N')`),
]);
```

- [ ] **Step 4: 계약 테스트를 통과시킨다.**

Run: `pnpm test -- database-schema.test.ts`

Expected: PASS.

### Task 3: 카테고리·템플릿·문서 테이블

**Files:**
- Create: `server/db/table/categories.table.ts`
- Create: `server/db/table/projectCategories.table.ts`
- Create: `server/db/table/templates.table.ts`
- Create: `server/db/table/templateHeadings.table.ts`
- Create: `server/db/table/projectTemplates.table.ts`
- Create: `server/db/table/documents.table.ts`
- Create: `server/db/table/documentRevisions.table.ts`

**Interfaces:**
- Produces: 카테고리 트리, 프로젝트 매핑, 템플릿 헤딩, 문서와 리비전 선언
- Consumes: `worlds`, `projects`, `admins`, `categories`, `templates`, `documents`

- [ ] **Step 1: 카테고리 깊이·템플릿 헤딩·문서 부분 UNIQUE 계약 테스트를 추가한다.**

```ts
expect(getTableConfig(schema.projects).indexes)
  .toEqual(expect.arrayContaining([expect.objectContaining({ name: 'uq_projects_world_id_name_active' })]));
expect(getTableConfig(schema.documentRevisions).indexes)
  .toEqual(expect.arrayContaining([expect.objectContaining({ name: 'uq_document_revisions_document_id_current' })]));
```

- [ ] **Step 2: 테스트가 새 테이블 부재로 실패하는지 확인한다.**

Run: `pnpm test -- database-schema.test.ts`

Expected: FAIL because category, template, or document table exports are absent.

- [ ] **Step 3: 7개 테이블과 depth·heading level·Y/N CHECK, 명세 UNIQUE, 프로젝트·문서 활성 부분 UNIQUE를 선언한다.**

```ts
uniqueIndex('uq_documents_project_id_title_active')
  .on(table.projectId, table.title)
  .where(sql`${table.delYn} = 'N'`),
check('ck_template_headings_level', sql`${table.level} in (1, 2, 3)`),
```

- [ ] **Step 4: 계약 테스트를 통과시킨다.**

Run: `pnpm test -- database-schema.test.ts`

Expected: PASS.

### Task 4: 관계 정의·월드 설정·실제 관계 테이블과 배럴

**Files:**
- Create: `server/db/table/relationshipTypes.table.ts`
- Create: `server/db/table/relationshipRoles.table.ts`
- Create: `server/db/table/relationshipRoleCategories.table.ts`
- Create: `server/db/table/worldRelationshipTypes.table.ts`
- Create: `server/db/table/worldRelationshipRoleCategories.table.ts`
- Create: `server/db/table/relationships.table.ts`
- Create: `server/db/table/relationshipTargets.table.ts`
- Create: `server/db/table/index.ts`

**Interfaces:**
- Produces: 나머지 7개 관계 테이블과 20개 테이블의 export-only 배럴
- Consumes: `worlds`, `admins`, `categories`, `documents`, 관계 정의 테이블

- [ ] **Step 1: 관계 방향·역할 순서·복합 UNIQUE 계약 테스트를 추가한다.**

```ts
expect(schema.relationshipTypes.directionType.enumValues).toEqual(['DIRECTED', 'SYMMETRIC']);
expect(getTableConfig(schema.relationshipTargets).uniqueConstraints)
  .toEqual(expect.arrayContaining([expect.objectContaining({ name: 'uq_relationship_targets_relationship_id_relationship_role_id' })]));
```

- [ ] **Step 2: 테스트가 관계 테이블 부재로 실패하는지 확인한다.**

Run: `pnpm test -- database-schema.test.ts`

Expected: FAIL because relationship table exports are absent.

- [ ] **Step 3: 관계 테이블의 FK, 기본/사용자 정의 Y/N·방향 CHECK, 역할 sort order CHECK와 명세 복합 UNIQUE를 선언하고 배럴에서 20개 전부 export한다.**

```ts
uniqueIndex('uq_world_relationship_role_categories_world_id_relationship_role_id_category_id')
  .on(table.worldId, table.relationshipRoleId, table.categoryId),
check('ck_relationship_roles_sort_order', sql`${table.sortOrder} between 1 and 4`),
```

- [ ] **Step 4: 전체 구조 계약 테스트를 통과시킨다.**

Run: `pnpm test -- database-schema.test.ts`

Expected: PASS.

### Task 5: 전체 정적 검증과 완료 커밋

**Files:**
- Modify: `test/database-schema.test.ts`
- Modify: `drizzle.dev.config.ts`
- Modify: `drizzle.prod.config.ts`
- Create: `server/db/table/*.table.ts`
- Create: `server/db/table/index.ts`

- [ ] **Step 1: 모든 20개 테이블의 공통 컬럼·snake_case·필수 제약을 검증하는 테스트를 완성한다.**

```ts
for (const table of Object.values(schema)) {
  expect(Object.keys(table)).toEqual(expect.arrayContaining([
    'id', 'useYn', 'delYn', 'createId', 'createDate', 'updateId', 'updateDate', 'deleteId', 'deleteDate',
  ]));
}
```

- [ ] **Step 2: 계약 테스트와 타입 검사를 실행한다.**

Run: `pnpm test -- database-schema.test.ts; .\\node_modules\\.bin\\vue-tsc.cmd --noEmit`

Expected: PASS.

- [ ] **Step 3: 대상 ESLint와 공백 오류 검사를 실행한다.**

Run: `pnpm lint -- server/db/table test/database-schema.test.ts drizzle.dev.config.ts drizzle.prod.config.ts; git diff --check`

Expected: PASS; 기존 무관한 실패가 있으면 구분해 기록한다.

- [ ] **Step 4: 스키마 구현 파일만 커밋한다.**

```bash
git add server/db/table drizzle.dev.config.ts drizzle.prod.config.ts test/database-schema.test.ts
git commit -m "2026 0818 feat: 옴니노드 드리즐 테이블 추가"
```
