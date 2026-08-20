# 옴니노드 API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `references/옴니노드 API 명세서.md`와 `references/옴니노드 데이터베이스 명세서.md`를 기준으로 Nuxt 4 Nitro API를 구현한다.

**Architecture:** API는 DB 테이블을 직접 노출하지 않고 도메인 Aggregate 기준으로 구현한다. 공통 응답은 HTTP Status 200 고정, `BaseResponse<TData>`의 `error`, 문자열 `code`, `message`, `data`로 업무 결과를 구분한다. 서버는 `server/db`, `server/utils`, `server/services`, `server/api`로 책임을 분리하고, 복구·권한·소프트 삭제 규칙은 서비스 계층에서 일관되게 처리한다.

**Tech Stack:** Nuxt 4.5, Nitro, TypeScript 6, Drizzle ORM 0.45, PostgreSQL, jose, argon2, Vitest

**Spec:** `references/옴니노드 API 명세서.md`

## Global Constraints

1. 모든 HTTP 애플리케이션 응답 Status는 200으로 고정한다.
2. 응답 `code`는 `app/data/response-code.data.ts`의 문자열 코드만 사용한다.
3. `any`를 사용하지 않는다.
4. 입력 검증은 API 경계에서 수행한다.
5. 소프트 삭제는 `delYn='Y'`로 처리하며 물리 삭제하지 않는다.
6. 동일명 삭제 데이터 생성 요청은 메인 row만 초기화 복구하고 기존 연관 row는 `useYn='N'`, `delYn='Y'` 처리 후 새로 생성한다.
7. SUB_ADMIN은 활성 `project_admin_permissions`가 없는 Project를 조회할 수 없다.
8. Category의 `parentId`, `depth`, Document의 `title`, Relationship의 `relationshipTypeId`는 생성 후 변경하지 않는다.
9. 기본 Category/Template은 전역, 사용자 정의 Category/Template은 Project 종속, 사용자 정의 Relationship Type과 Relationship은 World 종속이다.
10. 같은 World의 서로 다른 Project Document는 하나의 Relationship으로 연결할 수 있다.

---

### Task 1: 서버 공통 기반과 DB 클라이언트

**Files:**
- Modify: `server/db/client.ts`
- Create: `server/utils/response.ts`
- Create: `server/utils/request.ts`
- Create: `server/utils/errors.ts`
- Create: `server/services/common/list.service.ts`
- Test: `server/utils/response.test.ts`
- Test: `server/services/common/list.service.test.ts`

**Interfaces:**
- Produces: `useDb()`, `createResponse()`, `createListData()`, `readRequiredIdParam()`, `AppError`
- Consumes: `BaseResponse<TData>`, `ListData<TData>`, `responseCodeData`, `responseMessageData`

- [ ] **Step 1: 응답 계약 실패 테스트 작성**

`createResponse({ key: 'NOT_FOUND', data: null })`가 HTTP 상태와 무관하게 `{ error: true, code: 'NOT_FOUND', message, data: null }`를 만드는 테스트를 작성한다.

- [ ] **Step 2: 테스트를 실행하여 실패 확인**

Run: `pnpm test server/utils/response.test.ts`
Expected: `createResponse` 미구현으로 FAIL.

- [ ] **Step 3: PostgreSQL/Drizzle 클라이언트와 공통 응답 구현**

`useRuntimeConfig().databaseUrl`을 사용해 singleton PostgreSQL client와 Drizzle client를 생성한다. 성공/실패 여부는 `ResponseKey`에 대응하는 `code` 이름과 `error` 값으로 결정하고 HTTP Status를 변경하지 않는다.

- [ ] **Step 4: 목록 계산 테스트와 구현**

`page=0`, `pageSize=20`, `totalElements=25`, 목록 20개 입력에서 `startIndex=1`, `endIndex=20`, `hasNext=true`, `totalPages=2`를 검증한다.

- [ ] **Step 5: 대상 검증 실행**

Run: `pnpm test server/utils/response.test.ts server/services/common/list.service.test.ts`
Expected: PASS.

- [ ] **Step 6: 타입 검사**

Run: `pnpm exec vue-tsc --noEmit`
Expected: PASS 또는 기존 무관 오류를 별도 기록.

- [ ] **Step 7: 커밋**

```bash
git add server/db/client.ts server/utils server/services/common
git commit -m "2026 0820 feat: API 공통 서버 기반 추가"
```

---

### Task 2: 인증과 관리자 계정 기반

**Files:**
- Create: `server/services/auth/password.service.ts`
- Create: `server/services/auth/token.service.ts`
- Create: `server/services/auth/session.service.ts`
- Create: `server/utils/auth.ts`
- Create: `server/api/auth/signin.post.ts`
- Create: `server/api/auth/refresh.post.ts`
- Create: `server/api/auth/signout.post.ts`
- Create: `server/api/auth/me.get.ts`
- Create: `server/api/auth/password.patch.ts`
- Test: `server/services/auth/password.service.test.ts`
- Test: `server/services/auth/token.service.test.ts`

**Interfaces:**
- Produces: `hashPassword()`, `verifyPassword()`, `createAccessToken()`, `createRefreshToken()`, `requireAdmin()`, `requirePasswordChangedAdmin()`
- Consumes: `admins`, runtime JWT secrets, HTTP cookies

- [ ] **Step 1: 비밀번호와 JWT 실패 테스트 작성**

Argon2 해시 검증, access/refresh token 구분, 만료/위조 token 거부를 테스트한다.

- [ ] **Step 2: 실패 확인**

Run: `pnpm test server/services/auth/password.service.test.ts server/services/auth/token.service.test.ts`
Expected: FAIL.

- [ ] **Step 3: 인증 서비스 최소 구현**

Access/Refresh Token payload에는 최소 `adminId`, `role`, token type을 포함한다. Cookie는 HttpOnly로 설정한다.

- [ ] **Step 4: Auth 5개 엔드포인트 구현**

모든 업무 오류는 HTTP 200 + 문자열 코드로 반환한다. `passwordChangedYn='N'` 계정은 `me/password/signout/refresh` 외 보호 API 접근을 차단할 수 있도록 공통 guard를 제공한다.

- [ ] **Step 5: 대상 테스트와 타입 검사**

Run: `pnpm test server/services/auth/*.test.ts && pnpm exec vue-tsc --noEmit`
Expected: PASS 또는 기존 무관 오류 분리.

- [ ] **Step 6: 커밋**

```bash
git add server/services/auth server/utils/auth.ts server/api/auth
git commit -m "2026 0820 feat: 인증 API 추가"
```

---

### Task 3: ADMIN 신청·관리자·World 관리자·Project 권한

**Files:**
- Create: `server/services/admin/admin-request.service.ts`
- Create: `server/services/admin/admin.service.ts`
- Create: `server/services/admin/world-admin.service.ts`
- Create: `server/services/admin/project-permission.service.ts`
- Create: `server/api/admin-requests/**`
- Create: `server/api/admins/**`
- Create: `server/api/worlds/[worldId]/admins.get.ts`
- Create: `server/api/worlds/[worldId]/sub-admins/**`
- Create: `server/api/projects/[projectId]/sub-admins/[adminId]/permissions/**`
- Test: `server/services/admin/*.test.ts`

**Interfaces:**
- Produces: ADMIN 승인, SUB_ADMIN 생성/배정, Project 접근 판정, 21개 권한 저장
- Consumes: `admins`, `adminRequests`, `worldAdmins`, `projectAdminPermissions`

- [ ] **Step 1: ADMIN 신청 승인 트랜잭션 테스트 작성**

PENDING 요청 승인 시 ADMIN 생성과 상태 APPROVED가 함께 완료되고 World 매핑은 생성되지 않는지 검증한다.

- [ ] **Step 2: SUB_ADMIN Project 접근 테스트 작성**

활성 `project_admin_permissions`가 없거나 `useYn='N'`이면 조회 권한 자체가 false인지 검증한다.

- [ ] **Step 3: 실패 확인 후 서비스 구현**

Run: `pnpm test server/services/admin/*.test.ts`
Expected: 초기 FAIL 후 구현 완료 시 PASS.

- [ ] **Step 4: 명세 엔드포인트 구현**

ADMIN 신청 5개, Admin 관리, World 관리자 구성, Project Permission API를 구현한다.

- [ ] **Step 5: 검증과 커밋**

Run: `pnpm test server/services/admin/*.test.ts && pnpm exec vue-tsc --noEmit`

```bash
git add server/services/admin server/api/admin-requests server/api/admins server/api/worlds server/api/projects
git commit -m "2026 0820 feat: 관리자 권한 API 추가"
```

---

### Task 4: World와 Project API

**Files:**
- Create: `server/services/world/world.service.ts`
- Create: `server/services/project/project.service.ts`
- Create: `server/api/worlds/index.get.ts`
- Create: `server/api/worlds/index.post.ts`
- Create: `server/api/worlds/[worldId].get.ts`
- Create: `server/api/worlds/[worldId].patch.ts`
- Create: `server/api/worlds/[worldId]/status.patch.ts`
- Create: `server/api/worlds/[worldId].delete.ts`
- Create: `server/api/worlds/[worldId]/restore.post.ts`
- Create: `server/api/worlds/[worldId]/projects/**`
- Create: `server/api/projects/[projectId]/**`
- Test: `server/services/world/world.service.test.ts`
- Test: `server/services/project/project.service.test.ts`

**Interfaces:**
- Produces: World CRUD, Project CRUD, 동일명 초기화 복구, 접근 가능한 목록
- Consumes: `worlds`, `projects`, `worldAdmins`, `projectAdminPermissions`

- [ ] **Step 1: World 생성 트랜잭션 테스트**

ADMIN이 World 생성 시 `worlds`와 ADMIN `world_admins` 매핑이 함께 생성되는지 검증한다.

- [ ] **Step 2: Project 동일명 복구 테스트**

삭제 Project와 같은 이름 생성 요청에서 새 ID가 아닌 기존 ID를 유지하고 업무 필드를 초기화하는지 검증한다.

- [ ] **Step 3: 서비스와 API 구현**

SUPER_ADMIN/ADMIN/SUB_ADMIN 조회 범위를 명세대로 적용한다.

- [ ] **Step 4: 검증과 커밋**

Run: `pnpm test server/services/world/*.test.ts server/services/project/*.test.ts && pnpm exec vue-tsc --noEmit`

```bash
git add server/services/world server/services/project server/api/worlds server/api/projects
git commit -m "2026 0820 feat: 월드 프로젝트 API 추가"
```

---

### Task 5: Category와 Template API

**Files:**
- Create: `server/services/category/category.service.ts`
- Create: `server/services/template/template.service.ts`
- Create: `server/api/projects/[projectId]/categories/**`
- Create: `server/api/worlds/[worldId]/categories.get.ts`
- Create: `server/api/categories/[categoryId]/**`
- Create: `server/api/projects/[projectId]/templates/**`
- Create: `server/api/templates/[templateId]/**`
- Test: `server/services/category/category.service.test.ts`
- Test: `server/services/template/template.service.test.ts`

**Interfaces:**
- Produces: 기본+Project Category 조회, World Relation용 Category 조회, 사용자 정의 Category/Template 소속 관리, Template Heading 저장
- Consumes: `categories`, `projectCategories`, `templates`, `templateHeadings`, `projectTemplates`, `projects`

- [ ] **Step 1: Category 소속·계층 테스트**

기본 Category는 매핑 없이 사용 가능하고 사용자 정의 Category는 활성 `project_categories` 하나에만 귀속되는지, 다른 Project 사용자 정의 Category를 parent로 거부하는지 검증한다.

- [ ] **Step 2: Category 불변 테스트**

생성 후 `parentId`, `depth` 변경 요청을 거부하는지 검증한다.

- [ ] **Step 3: Template 미할당 테스트**

`project_templates.categoryId=NULL` 상태로 사용자 정의 Template이 Project에 소속될 수 있고 이후 1단계 Category에 할당 가능한지 검증한다.

- [ ] **Step 4: 복구 초기화 테스트**

Template 동일명 복구 시 기존 Heading/Project Template 매핑을 삭제 상태로 만들고 신규 연관 row를 생성하는지 검증한다.

- [ ] **Step 5: 서비스/API 구현 후 검증**

Run: `pnpm test server/services/category/*.test.ts server/services/template/*.test.ts && pnpm exec vue-tsc --noEmit`

- [ ] **Step 6: 커밋**

```bash
git add server/services/category server/services/template server/api/projects server/api/worlds server/api/categories server/api/templates
git commit -m "2026 0820 feat: 카테고리 템플릿 API 추가"
```

---

### Task 6: Document와 Revision API

**Files:**
- Create: `server/services/document/document.service.ts`
- Create: `server/services/document/revision.service.ts`
- Create: `server/api/projects/[projectId]/documents/**`
- Create: `server/api/documents/[documentId]/**`
- Test: `server/services/document/document.service.test.ts`
- Test: `server/services/document/revision.service.test.ts`

**Interfaces:**
- Produces: Document CRUD, Revision 생성/조회/복원
- Consumes: `documents`, `documentRevisions`, Category 소속 판정

- [ ] **Step 1: 최초 Revision 생성 테스트**

Document 생성 시 content가 빈 문자열이어도 최초 `currentYn='Y'` Revision이 정확히 하나 생성되는지 검증한다.

- [ ] **Step 2: 내용 변경 감지 테스트**

기존 content와 같으면 Revision을 만들지 않고 다르면 기존 current를 N으로 바꾼 뒤 신규 current Revision을 생성하는지 검증한다.

- [ ] **Step 3: 제목 불변·Category 경로 검증 테스트**

`title` 변경을 거부하고 문서 Project와 다른 Project 사용자 정의 Category 사용을 거부한다.

- [ ] **Step 4: 동일명 복구 테스트**

삭제 Document 복구 시 기존 Revision을 폐기하고 신규 최초 Revision을 생성한다.

- [ ] **Step 5: 서비스/API 구현 후 검증과 커밋**

Run: `pnpm test server/services/document/*.test.ts && pnpm exec vue-tsc --noEmit`

```bash
git add server/services/document server/api/projects server/api/documents
git commit -m "2026 0820 feat: 문서 리비전 API 추가"
```

---

### Task 7: Relationship Type·World 설정·Relationship API

**Files:**
- Create: `server/services/relationship/relationship-type.service.ts`
- Create: `server/services/relationship/world-relationship.service.ts`
- Create: `server/services/relationship/relationship.service.ts`
- Create: `server/api/worlds/[worldId]/relationship-types/**`
- Create: `server/api/relationship-types/[relationshipTypeId]/**`
- Create: `server/api/worlds/[worldId]/relationship-settings.get.ts`
- Create: `server/api/worlds/[worldId]/relationships/**`
- Create: `server/api/relationships/[relationshipId]/**`
- Create: `server/api/documents/[documentId]/relationships.get.ts`
- Test: `server/services/relationship/*.test.ts`

**Interfaces:**
- Produces: World 사용자 정의 Relationship Type, Role 2~4개, World 기본 관계 설정, 실제 Relationship/Targets
- Consumes: `relationshipTypes`, `relationshipRoles`, `relationshipRoleCategories`, `worldRelationshipTypes`, `worldRelationshipRoleCategories`, `relationships`, `relationshipTargets`, `documents`, `projects`

- [ ] **Step 1: Relationship Type Aggregate 테스트**

사용자 정의 Type 생성 시 World 소속, Role 2~4개, Role별 허용 Category가 하나의 트랜잭션으로 생성되는지 검증한다.

- [ ] **Step 2: World Category 범위 테스트**

Role Category는 기본 Category 또는 같은 World 모든 Project 사용자 정의 Category만 허용하고 다른 World Category는 거부한다.

- [ ] **Step 3: Relationship Target 무결성 테스트**

대상 Document들이 서로 다른 Project여도 같은 World이면 허용하고 다른 World Document가 하나라도 포함되면 거부한다. Role이 Type에 속하는지와 required Role 누락도 검증한다.

- [ ] **Step 4: Relationship Type 불변 테스트**

기존 Relationship의 `relationshipTypeId` 변경 요청을 거부한다.

- [ ] **Step 5: 복구 테스트**

Relationship Type 동일명 복구 시 기존 Role/Role Category를 삭제 상태로 만들고 새 row를 생성한다.

- [ ] **Step 6: 서비스/API 구현 후 검증**

Run: `pnpm test server/services/relationship/*.test.ts && pnpm exec vue-tsc --noEmit`

- [ ] **Step 7: 커밋**

```bash
git add server/services/relationship server/api/worlds server/api/relationship-types server/api/relationships server/api/documents
git commit -m "2026 0820 feat: 관계 API 추가"
```

---

### Task 8: 전체 정합성 검증과 문서 동기화

**Files:**
- Modify: `references/옴니노드 API 명세서.md` only if implementation reveals a contract mismatch
- Modify: `references/옴니노드 데이터베이스 명세서.md` only if actual Drizzle constraints differ from the document
- Modify: `TODO.md` if current project tracking requires it

**Interfaces:**
- Consumes: Tasks 1~7 전체 결과
- Produces: 구현과 명세가 동일한 최종 상태

- [ ] **Step 1: 전체 테스트**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 2: 린트**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 3: 타입 검사**

Run: `pnpm exec vue-tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Nuxt 준비와 빌드**

Run: `pnpm exec nuxi prepare && pnpm build`
Expected: PASS.

- [ ] **Step 5: Drizzle schema generate 검증**

Run: `pnpm db:dev:generate`
Expected: schema parsing/generation PASS. 생성된 migration 파일은 실제 반영 정책에 맞춰 검토한다.

- [ ] **Step 6: 명세 대조**

API 경로, HTTP 200 고정, 문자열 ResponseCode, 소속 범위, 복구 정책, 조건부 UNIQUE가 실제 구현과 일치하는지 항목별로 확인한다.

- [ ] **Step 7: 최종 커밋**

```bash
git add .
git commit -m "2026 0820 chore: API 구현 정합성 검증"
```
