# 관리자 라우트 골격 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended; unavailable for this inline task) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 인증, 관리자 계정·권한 관리, 프로젝트별 관리자 관리에 필요한 Nuxt 페이지 라우트 골격을 추가한다.

**Architecture:** 기존 옴니노드 라우트 골격과 동일하게 각 페이지는 `useSetMeta`로 제목과 URL을 설정하고 화면에 표시되지 않는 `<span hidden />`만 렌더링한다. 이번 작업은 라우트 등록과 파일 존재 계약만 다루며 UI, 인증, API, 권한 판정은 포함하지 않는다.

**Tech Stack:** Nuxt 4 파일 기반 라우팅, Vue 3 SFC, TypeScript, Vitest

## Global Constraints

- 모든 신규 페이지는 `useSetMeta`를 호출한다.
- 모든 신규 페이지의 템플릿 루트는 `<span hidden />`만 사용한다.
- 관리자·인증 API, 미들웨어, 실제 화면 컴포넌트는 이번 작업에서 구현하지 않는다.
- 동적 세그먼트는 `[adminId]`를 사용한다.
- 기존 라우트와 테스트를 수정하지 않는다.

---

### Task 1: 관리자 라우트 파일 존재 계약을 테스트로 고정

**Files:**
- Create: `test/admin-route-scaffolding.test.ts`

- [ ] **Step 1: 신규 관리자 라우트 목록과 제외 규칙을 테스트에 작성한다.**
- [ ] **Step 2: 테스트를 실행해 신규 파일 부재로 실패하는지 확인한다.**

### Task 2: 인증·계정 라우트 추가

**Files:**
- Create: `app/pages/login.vue`
- Create: `app/pages/account.vue`
- Create: `app/pages/account/password-change.vue`

- [ ] **Step 1: 각 페이지에 메타 설정과 빈 루트를 추가한다.**
- [ ] **Step 2: 관리자 라우트 테스트를 실행한다.**

### Task 3: 전역 관리자·권한 라우트 추가

**Files:**
- Create: `app/pages/admin/index.vue`
- Create: `app/pages/admin/admins/index.vue`
- Create: `app/pages/admin/admins/new.vue`
- Create: `app/pages/admin/admins/[adminId]/index.vue`
- Create: `app/pages/admin/admins/[adminId]/edit.vue`
- Create: `app/pages/admin/admins/[adminId]/permissions.vue`
- Create: `app/pages/admin/permissions.vue`

- [ ] **Step 1: 전역 관리자 페이지 파일을 추가한다.**
- [ ] **Step 2: 모든 파일의 `useSetMeta` 적용을 테스트한다.**

### Task 4: 프로젝트 관리자 라우트 추가

**Files:**
- Create: `app/pages/projects/[projectId]/admins.vue`

- [ ] **Step 1: 프로젝트별 관리자 관리 페이지를 추가한다.**
- [ ] **Step 2: 신규 라우트 전용 테스트와 기존 전체 테스트를 실행한다.**

### Task 5: 검증 및 커밋

- [ ] **Step 1: 신규 테스트, 전체 테스트, 타입 검사와 린트를 실행한다.**
- [ ] **Step 2: 변경 파일과 테스트 결과를 확인한다.**
- [ ] **Step 3: `2026 0814 feat: 관리자 라우트 골격 추가` 형식으로 커밋한다.**
