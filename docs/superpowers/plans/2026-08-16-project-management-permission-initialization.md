# 프로젝트 관리와 권한 초기화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 승인된 ADMIN이 프로젝트를 생성하면 소유자 배정과 18개 프로젝트 권한이 원자적으로 초기화되는 프로젝트 CRUD를 제공한다.

**Architecture:** 프로젝트 서비스가 생성·복구·수정·삭제와 프로젝트 권한 초기화를 조합한다. API와 UI는 프로젝트 서비스만 호출하고, 세부 권한 판정은 단계 2의 프로젝트별 권한 서비스를 재사용한다.

**Tech Stack:** Nuxt 4, Vue 3, PostgreSQL Drizzle, Vitest, Element Plus, CVA.

## Global Constraints

- `project.create`는 활성 ADMIN과 SUPER_ADMIN만 요청할 수 있다.
- 생성은 `projects`, 활성 `project_admins`, 18개 `admin_permissions = Y`를 하나의 DB transaction으로 저장한다.
- 수정·삭제는 프로젝트별 `project.update`·`project.delete`를 요구하고 비가시 대상은 `NOT_FOUND`로 숨긴다.

### Task 1: 프로젝트 서비스와 권한 초기화

**Files:** `server/repositories/project.repository.ts`, `server/services/project.service.ts`, `test/project.service.test.ts`

- [ ] 실패 테스트에서 프로젝트 생성 뒤 18개 권한과 생성자 배정이 함께 저장되는지 고정한다.
- [ ] `create`, `list`, `get`, `update`, `softDelete` 저장소·서비스를 구현한다.
- [ ] `create`에서 `permissionService.can({ permission: 'project.create' })`과 권한 초기화 함수를 같은 transaction으로 호출한다.
- [ ] `pnpm exec vitest run test/project.service.test.ts`를 통과시킨다.

### Task 2: 프로젝트 API와 UI

**Files:** `server/api/projects/`, `app/components/project/ProjectList.vue`, `ProjectForm.vue`, `ProjectDetail.vue`, `app/pages/projects/`, `test/project-api.test.ts`, `test/project-ui.test.ts`

- [ ] API·UI 실패 테스트를 작성한다.
- [ ] 목록·생성·상세·수정·삭제 API를 구현한다.
- [ ] 목록·생성·상세·설정 화면을 CVA 컴포넌트로 구현한다.
- [ ] `pnpm exec vitest run test/project-api.test.ts test/project-ui.test.ts`를 통과시킨다.

### Task 3: 단계 3 검증과 완료 기록

- [ ] TODO 단계 3에 실제 완료된 항목만 체크한다.
- [ ] 전체 테스트·린트·타입 검사·빌드와 `git diff --check`를 실행한다.
- [ ] 단계 3 완료 리포트와 날짜·타입 형식 커밋을 작성한다.
