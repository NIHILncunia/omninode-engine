# 단계 2 권한 정정 후속 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프로젝트 관리자 배정과 권한 행의 수명을 일치시키고, 삭제 ADMIN 재승인 및 최신 관리자 상태를 안전하게 제공한다.

**Architecture:** 권한 repository가 배정·18개 권한 행을 단일 transaction으로 소프트 삭제·복구한다. 요청 승인 repository는 관리자 복구와 요청 상태 전이를 transaction으로 묶고, 메일 전달은 commit 뒤에 수행한다. 관리자 화면은 Vue Query 응답을 `administrator.store.ts`에 반영한다.

**Tech Stack:** Nuxt 4, Vue 3, Pinia, TanStack Vue Query, PostgreSQL Drizzle, Vitest, Element Plus.

## Global Constraints

- SUPER_ADMIN만 프로젝트 권한 행 없이 우회한다.
- 권한 판정은 활성 ADMIN, 활성 `project_admins`, 활성 `admin_permissions.grantYn='Y'`를 요구한다.
- 해제는 배정과 18개 권한 행을 함께 소프트 삭제하고, 재배정은 모두 복구·갱신한다.
- 삭제 ADMIN 이메일은 재요청·승인 시 기존 행을 복구한다.
- 조회 성공 결과는 Vue Query에서 도메인 `<domain>.store.ts`로 동기화하며, mutation은 낙관 갱신하지 않는다.

---

### Task 1: 활성 배정 기반 권한 판정과 수명 transaction

**Files:**
- Modify: `server/repositories/permission.repository.ts`, `server/types/administrator.types.ts`, `server/services/project-admin.service.ts`
- Modify: `test/project-permission.service.test.ts`
- Create: `test/project-admin-repository.test.ts`

**Interfaces:**
- Produces: `findActiveProjectPermission(projectId, adminId, code)` that joins active `projectAdmins`.
- Produces: `softDeleteProjectAdminWithPermissions(projectId, adminId, actorAdminId, now)` that soft deletes the assignment and every matching permission row in one transaction.

- [ ] Write a failing test proving an inactive assignment cannot authorize a `Y` permission.
- [ ] Run `pnpm exec vitest run test/project-permission.service.test.ts` and confirm the new assertion fails.
- [ ] Join `projectAdmins` with active state conditions in the permission repository query.
- [ ] Write a repository contract test for soft deleting assignment and permission rows together.
- [ ] Implement the transaction and route project-admin removal through it.
- [ ] Run `pnpm exec vitest run test/project-permission.service.test.ts test/project-admin-repository.test.ts`.
- [ ] Commit: `2026 0816 fix: 프로젝트 관리자 권한 해제 정정`.

### Task 2: 삭제 ADMIN 재승인 transaction

**Files:**
- Modify: `server/repositories/admin-permission-request.repository.ts`, `server/repositories/administrator.repository.ts`, `server/services/admin-permission-request.service.ts`, `server/types/admin-permission-request.types.ts`
- Modify: `test/admin-permission-request.service.test.ts`

**Interfaces:**
- Produces: one approval repository method that restores or creates ADMIN and marks a PENDING request APPROVED atomically.
- Keeps SMTP delivery outside the transaction and preserves no plaintext password.

- [ ] Write a failing service test for a deleted email that is restored on approval.
- [ ] Run `pnpm exec vitest run test/admin-permission-request.service.test.ts` and confirm it fails.
- [ ] Add the transaction method and use it from approval.
- [ ] Keep delivery success/failure timestamp updates after transaction commit.
- [ ] Run `pnpm exec vitest run test/admin-permission-request.service.test.ts`.
- [ ] Commit: `2026 0816 fix: 삭제 관리자 재승인 복구 추가`.

### Task 3: 권한 마스터 seed와 폐기 모델 제거

**Files:**
- Modify: `server/data/permission.data.ts`, `server/repositories/permission.repository.ts`, `server/services/permission.service.ts`
- Create: `server/services/permission-master.service.ts`, `test/permission-master.service.test.ts`

- [ ] Write a failing test for explicit SUPER_ADMIN actor seed of exactly 18 definitions.
- [ ] Run `pnpm exec vitest run test/permission-master.service.test.ts` and confirm it fails.
- [ ] Implement an explicit idempotent seed service; do not call it from request handlers.
- [ ] Remove role-default permission helpers and their stale SUB_ADMIN expressions.
- [ ] Run `pnpm exec vitest run test/permission-master.service.test.ts test/project-permission.service.test.ts`.
- [ ] Commit: `2026 0816 refactor: 권한 마스터 초기화 정리`.

### Task 4: 최신 관리자 화면 상태

**Files:**
- Create: `app/stores/administrator.store.ts`
- Modify: `app/components/admin/AdminList.vue`, `AdminDetail.vue`, `AdminEditForm.vue`
- Create: `test/administrator-store.test.ts`

- [ ] Write a failing store test for replacing list/detail state with a fresh server payload.
- [ ] Run `pnpm exec vitest run test/administrator-store.test.ts` and confirm it fails.
- [ ] Add store setters and replace component GET calls with `useQuery` success synchronization.
- [ ] Replace mutations with invalidation/refetch flows; do not apply optimistic changes.
- [ ] Run `pnpm exec vitest run test/administrator-store.test.ts test/app-sidebar.test.ts`.
- [ ] Commit: `2026 0816 refactor: 관리자 최신 상태 조회 이관`.

### Task 5: 추적·통합 검증·완료 기록

**Files:**
- Modify: `TODO.md`, `docs/superpowers/reports/2026-08-16-admin-request-project-permission-correction-completion.md`

- [ ] Update only verified Stage 2 items and remove stale completion claims.
- [ ] Run `pnpm test`, `pnpm lint`, `pnpm exec vue-tsc --noEmit`, `pnpm build`, and `git diff --check`.
- [ ] Record exact results, current commits, and Stage 3 start conditions in the completion report.
- [ ] Commit: `2026 0816 docs: 권한 정정 후속 완료 기록`.
