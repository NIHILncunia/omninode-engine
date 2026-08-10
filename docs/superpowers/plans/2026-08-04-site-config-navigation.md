# 사이트 설정 내비게이션 통합 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사이트 설정이 외부 링크와 내비게이션을 함께 제공하게 한다.

**Architecture:** `NavigationItem`과 `navigation` 배열을 사이트 설정 계약으로 이동한다. 사이드바는 별도 모듈 대신 `siteConfig.navigation`을 읽는다.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Vitest

## Global Constraints

- 메뉴 객체는 `label`, `to`, `icon` 필드를 유지한다.
- 기존 메뉴 이동 이벤트를 유지한다.
- 커밋과 푸시는 마스터가 별도로 요청할 때만 수행한다.

---

### Task 1: 사이트 설정으로 내비게이션 통합

**Files:**
- Modify: `app/types/common.types.ts`
- Modify: `app/config/site.config.ts`
- Modify: `app/components/common/AppSidebar.vue`
- Modify: `test/app-sidebar.test.ts`
- Delete: `app/config/navigation.config.ts`

**Interfaces:**
- Produces: `SiteConfig.navigation: NavigationItem[]`
- Consumes: `siteConfig.navigation`

- [ ] **Step 1: 사이트 설정 내비게이션 계약을 검증하는 실패 테스트 작성**

```ts
expect(siteConfig.navigation).toEqual([
  { label: '대시보드', to: '/', icon: 'mdi:view-dashboard-outline' },
  { label: '문서', to: '/docs', icon: 'mdi:file-document-outline' },
  { label: '설정', to: '/settings', icon: 'mdi:cog-outline' },
]);
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm exec vitest run test/app-sidebar.test.ts`
Expected: `navigation` 속성이 없어 실패.

- [ ] **Step 3: 타입·설정·사이드바 참조를 전환하고 전용 설정 파일 제거**

`NavigationItem`과 `navigation` 배열을 사이트 설정 계약에 추가하고, 사이드바와 테스트가 `siteConfig.navigation`을 사용하게 바꾼다.

- [ ] **Step 4: 통과 확인**

Run: `pnpm exec vitest run test/app-sidebar.test.ts`
Expected: PASS.

### Task 2: 범위 검증

**Files:**
- Verify: `app/types/common.types.ts`, `app/config/site.config.ts`, `app/components/common/AppSidebar.vue`, `test/app-sidebar.test.ts`

- [ ] **Step 1: 참조 및 형식 검사**

Run: `pnpm exec eslint app/types/common.types.ts app/config/site.config.ts app/components/common/AppSidebar.vue test/app-sidebar.test.ts && pnpm exec vue-tsc --noEmit && rg -n "navigation.config" app test`
Expected: ESLint와 타입 검사 통과, 기존 전용 설정 참조 없음.

- [ ] **Step 2: 전체 회귀 검사**

Run: `pnpm test && pnpm build && git diff --check`
Expected: 모든 명령 통과.
