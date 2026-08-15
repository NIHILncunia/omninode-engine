# Omninode 인증·계정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HttpOnly 쿠키 기반 로그인·토큰 회전·비밀번호 변경을 UI와 API에서 검증한다.

**Architecture:** `server/utils`는 Argon2id, JWT, 쿠키를 다루고, repository는 Drizzle로 관리자·refresh token을 저장한다. service는 인증 규칙과 토큰 회전을 트랜잭션으로 조합하며 API handler는 입력 검증·쿠키 설정·표준 응답만 맡는다.

**Tech Stack:** Nuxt 4, Nitro, PostgreSQL Drizzle, Argon2id, jose, Vitest, Pinia, Element Plus.

## Global Constraints

- access·refresh token은 응답 본문이 아닌 HttpOnly, SameSite=Lax 쿠키로만 전달한다.
- access는 15분·`Path=/`, refresh는 14일·`Path=/api/auth`이며 refresh 때 둘 다 회전한다.
- 비밀번호는 8자 이상 Argon2id 해시만 저장한다.
- 역할·프로젝트 권한 판단은 단계 2 범위다.

---

### Task 1: 인증 의존성과 타입 계약

**Files:** `package.json`, `pnpm-lock.yaml`, `app/types/auth.types.ts`, `server/types/auth.types.ts`, `test/auth-utils.test.ts`

- [x] Argon2id와 `jose`를 추가한다: `pnpm add argon2 jose`.
- [x] 실패 테스트로 `hashPassword`, `verifyPassword`, `createAccessToken`, `verifyAccessToken`, `hashRefreshToken`의 기대 계약을 작성한다.
- [x] 비밀번호·JWT·refresh hash 유틸리티와 관리자 공개 DTO를 구현한다.
- [x] `pnpm exec vitest run test/auth-utils.test.ts`를 통과시킨다.

### Task 2: 저장소와 인증 서비스

**Files:** `server/repositories/admin.repository.ts`, `server/repositories/admin-refresh-token.repository.ts`, `server/services/auth.service.ts`, `test/auth-service.test.ts`

- [x] 로그인·refresh 회전·로그아웃·비밀번호 변경 실패 테스트를 작성한다.
- [x] repository에 이메일 관리자 조회, refresh 생성·폐기·조회, 관리자 비밀번호·마지막 로그인 갱신을 구현한다.
- [x] service에 비활성·삭제 계정 공통 `UNAUTHORIZED`, refresh 원자적 회전, 비밀번호 변경 시 활성 refresh 전부 폐기를 구현한다.
- [x] `pnpm exec vitest run test/auth-service.test.ts`를 통과시킨다.

### Task 3: 쿠키와 인증 API

**Files:** `server/utils/auth-cookie.ts`, `server/api/auth/signin.post.ts`, `refresh.post.ts`, `signout.post.ts`, `me.get.ts`, `password.post.ts`, `test/auth-api.test.ts`

- [x] 다섯 API의 성공·실패·쿠키 계약 실패 테스트를 작성한다.
- [x] `omninode_access`, `omninode_refresh`의 HttpOnly·SameSite·경로·만료 설정 및 만료 함수를 구현한다.
- [x] handler에서 요청 본문을 검증하고 service를 호출해 `CreateResponse`를 반환한다. refresh·비밀번호 변경은 두 쿠키를 모두 회전한다.
- [x] `pnpm exec vitest run test/auth-api.test.ts`를 통과시킨다.

### Task 4: auth store 복구와 화면 수직 슬라이스

**Files:** `app/stores/auth.store.ts`, `app/components/auth/SigninForm.vue`, `AccountProfile.vue`, `PasswordChangeForm.vue`, `app/pages/signin.vue`, `account.vue`, `account/password-change.vue`, `test/auth-ui.test.ts`

- [x] 로그인·초기 `me` 복구·비밀번호 변경 강제·로그아웃의 실패 UI 테스트를 작성한다.
- [x] store에 관리자 DTO, `onRestoreSession`, `onSignOut`을 추가하고 token 값은 저장하지 않는다.
- [x] 각 페이지는 `useSetMeta`와 렌더링 컴포넌트만 두며 컴포넌트는 CVA·`cn()`·loading/error 상태로 API를 호출한다.
- [x] `pnpm exec vitest run test/auth-ui.test.ts test/auth-store.test.ts test/auth-middleware.test.ts`를 통과시킨다.

### Task 5: 통합 검증과 진행 기록

**Files:** `TODO.md`, `references/옴니노드_UI_API_통합_작업_설계서.md`

- [x] 인증 대상 테스트, `pnpm test`, `pnpm lint`, `pnpm exec vue-tsc --noEmit`, `pnpm build`를 실행한다.
- [x] 기존 무관 린트 실패는 변경 파일 실패와 분리해 `TODO.md`에 기록한다.
- [x] 단계 1 완료 기준과 다음 단계 2 재개 지점을 갱신한다.
- [ ] 마스터가 요청한 경우에만 `2026 0815 feat: 인증 기반 추가` 형식으로 커밋한다.
