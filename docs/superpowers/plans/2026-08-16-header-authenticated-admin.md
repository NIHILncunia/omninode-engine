# 기본 레이아웃 인증 관리자 표시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기본 레이아웃 헤더 우측에 로그인한 관리자의 이메일과 이름을 조건부로 표시한다.

**Architecture:** `HeaderAuthenticatedAdmin` 공통 컴포넌트가 `auth.store`의 반응형 `admin` 상태만 읽어 표시를 결정한다. `default` 레이아웃은 기존 로고·사이트명 헤더의 우측에 이 컴포넌트를 배치하며, 네트워크 요청이나 새 store는 추가하지 않는다.

**Tech Stack:** Nuxt 4, Vue 3, Pinia, Element Plus, CVA, Vitest.

## Global Constraints

- 헤더 좌측 로고·사이트명 구조는 유지한다.
- 이메일과 이름만 표시하며 역할·드롭다운·계정 이동·로그아웃 기능은 추가하지 않는다.
- 로그인 상태일 때만 관리자 정보 DOM을 렌더링한다.
- 공개 페이지가 사용하는 `default` 레이아웃의 헤더는 유지한다.
- `/signin`, `/account/password-change`의 `auth` 레이아웃은 변경하지 않는다.
- 공통 UI 컴포넌트는 CVA와 `cn()` 규칙을 따른다.

---

### Task 1: 헤더 인증 관리자 표시 컴포넌트와 레이아웃 연결

**Files:**
- Create: `app/components/common/HeaderAuthenticatedAdmin.vue`
- Modify: `app/layouts/default.vue`
- Modify: `test/app-sidebar.test.ts`
- Create: `test/header-authenticated-admin.test.ts`

**Interfaces:**
- Consumes: `useAuthStore()`의 `admin: Ref<AuthenticatedAdmin | null>`.
- Produces: 로그인 상태에서 이메일·이름을 렌더링하고, 비로그인 상태에서는 렌더링하지 않는 `<HeaderAuthenticatedAdmin />`.

- [ ] **Step 1: 실패하는 컴포넌트·레이아웃 테스트를 작성한다.**

```ts
const auth = useAuthStore();
auth.onSetAuthenticated(false, {
  id: 1,
  email: 'admin@example.com',
  name: '관리자',
  role: 'SUPER_ADMIN',
  passwordChangeRequired: false,
});

expect(wrapper.text()).toContain('admin@example.com');
expect(wrapper.text()).toContain('관리자');
```

새 테스트에서는 `onSetUnauthenticated()` 뒤 이메일·이름이 렌더링되지 않는지도 검증한다. 기존 `app-sidebar.test.ts`의 기본 레이아웃 검증에는 `<HeaderAuthenticatedAdmin />` 포함 여부를 추가한다.

- [ ] **Step 2: 대상 테스트가 실패하는지 확인한다.**

Run: `pnpm test -- header-authenticated-admin.test.ts app-sidebar.test.ts`

Expected: FAIL because `HeaderAuthenticatedAdmin.vue` does not exist and the default layout does not render it.

- [ ] **Step 3: 최소 공통 컴포넌트를 구현한다.**

```vue
<template>
  <div
    v-if="auth.admin"
    :class="cn([cssVariants({})])"
  >
    <span class="text-sm text-black-600">{{ auth.admin.email }}</span>
    <strong class="text-sm font-600">{{ auth.admin.name }}</strong>
  </div>
</template>
```

`cssVariants`는 `flex`, `flex-col`, `items-end`, `gap-1`만 포함한다. `default.vue`의 `ElHeader` 우측에 `<HeaderAuthenticatedAdmin />`을 추가하며, 로고·사이트명은 변경하지 않는다.

- [ ] **Step 4: 대상 테스트가 통과하는지 확인한다.**

Run: `pnpm test -- header-authenticated-admin.test.ts app-sidebar.test.ts`

Expected: PASS.

- [ ] **Step 5: 전체 검증과 단계 커밋을 실행한다.**

Run: `pnpm test && pnpm lint && pnpm exec vue-tsc --noEmit && pnpm build && git diff --check`

Expected: PASS.

현재 단계 2.5의 미완료 변경과 분리할 수 없으므로, 이 작업만으로는 커밋하지 않는다. 단계 2.5 완료 기준이 충족될 때 관련 변경을 함께 커밋한다.
