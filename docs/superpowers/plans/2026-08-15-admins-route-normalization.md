# 관리자 목록 루트 경로 정정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 목록과 하위 화면의 정식 URL을 `/admin/admins`가 아닌 `/admins` 계열로 통일한다.

**Architecture:** Nuxt 파일 기반 라우팅에 맞춰 관리자 목록 페이지 파일을 `app/pages/admin/admins/`에서 `app/pages/admins/`로 이동한다. `/admin`은 독립 관리자 대시보드로 유지하며, 테스트와 현재 통합 설계서의 경로 표기만 새 URL로 갱신한다.

**Tech Stack:** Nuxt 4 파일 기반 라우팅, Vitest, TypeScript.

## Global Constraints

- `/admin`은 유지하고 `/admin/admins` 및 하위 경로는 제공하지 않는다.
- 정식 관리자 목록 경로는 `/admins`, `/admins/new`, `/admins/:adminId`, `/admins/:adminId/edit`, `/admins/:adminId/permissions`다.
- 과거 구현 계획 문서는 당시 기록으로 보존한다.
- 마스터의 별도 요청 없이는 커밋하지 않는다.

---

### Task 1: 관리자 목록 라우트 정합화

**Files:**
- Move: `app/pages/admin/admins/index.vue` → `app/pages/admins/index.vue`
- Move: `app/pages/admin/admins/new.vue` → `app/pages/admins/new.vue`
- Move: `app/pages/admin/admins/[adminId]/index.vue` → `app/pages/admins/[adminId]/index.vue`
- Move: `app/pages/admin/admins/[adminId]/edit.vue` → `app/pages/admins/[adminId]/edit.vue`
- Move: `app/pages/admin/admins/[adminId]/permissions.vue` → `app/pages/admins/[adminId]/permissions.vue`
- Modify: `test/admin-route-scaffolding.test.ts`
- Modify: `references/옴니노드_UI_API_통합_작업_설계서.md`

**Interfaces:**
- Consumes: Nuxt 파일 시스템 라우팅과 각 페이지의 `useSetMeta` 계약.
- Produces: `/admins` 계열 페이지 파일과 같은 URL을 사용하는 메타·테스트·현재 설계 기준.

- [x] **Step 1: 라우트 골격 실패 테스트 작성**

`test/admin-route-scaffolding.test.ts`의 목록 파일을 다음 경로로 바꾸고, 이전 경로가 존재하지 않는지 검증한다.

```ts
expect(existsSync(resolve(process.cwd(), 'app/pages/admins/index.vue'))).toBe(true);
expect(existsSync(resolve(process.cwd(), 'app/pages/admin/admins/index.vue'))).toBe(false);
```

- [x] **Step 2: 실패 테스트 실행**

Run: `pnpm exec vitest run test/admin-route-scaffolding.test.ts`

Expected: `/admins` 파일이 없어 실패한다.

- [x] **Step 3: 페이지 파일 이동과 메타 URL 정정**

각 파일을 `app/pages/admins/`로 이동하고 `useSetMeta`의 URL을 각각 `/admins` 계열로 정정한다. 원본 디렉터리는 제거해 `/admin/admins` 중복 라우트를 만들지 않는다.

- [x] **Step 4: 현재 설계서 경로 정정**

`references/옴니노드_UI_API_통합_작업_설계서.md`의 관리자 계정 화면 목록을 `/admins` 계열로 바꾼다.

- [x] **Step 5: 테스트와 타입 검사 실행**

Run: `pnpm exec vitest run test/admin-route-scaffolding.test.ts && pnpm exec vue-tsc --noEmit`

Expected: 둘 다 통과한다.

- [ ] **Step 6: 커밋은 마스터 요청 시에만 수행**

```text
2026 0815 refactor: 관리자 목록 루트 경로 정정
```
