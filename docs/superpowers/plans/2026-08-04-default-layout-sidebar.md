# 기본 레이아웃과 사이드바 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Element Plus 기반의 데스크톱 사이드바와 모바일 Drawer를 가진 기본 앱 셸을 제공한다.

**Architecture:** 메뉴 데이터와 메뉴 렌더링을 레이아웃에서 분리한다. `default.vue`는 Element Plus 컨테이너와 반응형 Aside/Drawer를 조합하고, Pinia의 `isSidebarOpen`은 모바일 Drawer에만 양방향 연결한다.

**Tech Stack:** Nuxt 4, Vue 3, Element Plus, Pinia, Nuxt Icon, Vitest

## Global Constraints

- 데스크톱에서는 272px `ElAside`를 기본 표시한다.
- 모바일에서는 Aside를 렌더링하지 않고 `ElDrawer`를 기본 닫힘으로 표시한다.
- 메뉴는 `label`, `to`, `icon` 설정으로 관리하며 기본값은 대시보드(`/`), 문서(`/docs`), 설정(`/settings`)이다.
- `isSidebarOpen`은 모바일 Drawer 상태만 담당하고 API 요청 상태는 포함하지 않는다.
- `ElContainer`, `ElHeader`, `ElAside`, `ElMain`, `ElFooter`, `ElDrawer`, `ElMenu`를 사용한다.
- 커밋과 푸시는 마스터가 별도로 요청할 때만 수행한다.

---

### Task 1: 메뉴 설정과 공통 사이드바

**Files:**
- Create: `app/config/navigation.config.ts`
- Create: `app/components/common/AppSidebar.vue`
- Create: `test/app-sidebar.test.ts`

**Interfaces:**
- Produces: `NavigationItem { label: string; to: string; icon: string }`, `navigationItems`
- Produces: `AppSidebar` event `navigate`

- [ ] **Step 1: failing test 작성**

```ts
it('renders every configured navigation item and emits navigate', async () => {
  const wrapper = mount(AppSidebar);
  expect(wrapper.text()).toContain('대시보드');
  expect(wrapper.get('a[href="/docs"]').text()).toContain('문서');
  await wrapper.get('a[href="/settings"]').trigger('click');
  expect(wrapper.emitted('navigate')).toHaveLength(1);
});
```

- [ ] **Step 2: failing test 실행**

Run: `pnpm exec vitest run test/app-sidebar.test.ts`

Expected: FAIL because `AppSidebar.vue` does not exist.

- [ ] **Step 3: 설정과 `ElMenu` 기반 사이드바 구현**

```ts
export const navigationItems: NavigationItem[] = [
  { label: '대시보드', to: '/', icon: 'mdi:view-dashboard-outline' },
  { label: '문서', to: '/docs', icon: 'mdi:file-document-outline' },
  { label: '설정', to: '/settings', icon: 'mdi:cog-outline' },
];
```

`AppSidebar`는 `ElMenu`와 `ElMenuItem`으로 항목을 렌더링하고, 각 `NuxtLink` 클릭에 `navigate`를 emit한다. 외부 `class` prop은 CVA와 `cn()`으로 병합한다.

- [ ] **Step 4: test 통과 확인**

Run: `pnpm exec vitest run test/app-sidebar.test.ts`

Expected: PASS.

### Task 2: Element Plus 앱 셸과 모바일 Drawer 연결

**Files:**
- Create: `app/components/common/AppHeader.vue`
- Modify: `app/layouts/default.vue`
- Create: `test/default-layout.test.ts`

**Interfaces:**
- Consumes: `AppSidebar`, `useAppStore().isSidebarOpen`, `onSetSidebarOpen`
- Produces: 데스크톱 Aside 및 모바일 Drawer 기본 레이아웃

- [ ] **Step 1: failing test 작성**

```ts
it('opens and closes the mobile drawer through the app store', async () => {
  const wrapper = mount(DefaultLayout, { global: { plugins: [ createPinia() ] } });
  const store = useAppStore();
  await wrapper.get('[aria-label="메뉴 열기"]').trigger('click');
  expect(store.isSidebarOpen).toBe(true);
  await wrapper.findComponent(AppSidebar).vm.$emit('navigate');
  expect(store.isSidebarOpen).toBe(false);
});
```

- [ ] **Step 2: failing test 실행**

Run: `pnpm exec vitest run test/default-layout.test.ts`

Expected: FAIL because `AppHeader.vue` and Drawer wiring do not exist.

- [ ] **Step 3: Header와 responsive layout 구현**

`AppHeader`는 모바일 전용 `ElButton` 메뉴 제어와 브랜드 `NuxtLink`를 렌더링한다. `default.vue`는 아래 구조를 따른다.

```vue
<ElContainer class="h-dvh overflow-hidden" direction="vertical">
  <ElHeader><AppHeader @open-sidebar="appStore.onSetSidebarOpen(true)" /></ElHeader>
  <ElContainer class="min-h-0 flex-1">
    <ElAside class="hidden w-68! md:block"><AppSidebar /></ElAside>
    <ElMain class="min-w-0 overflow-y-auto"><slot /></ElMain>
  </ElContainer>
  <ElFooter>...</ElFooter>
  <ElDrawer v-model="appStore.isSidebarOpen" title="메뉴" direction="ltr" size="272px">
    <AppSidebar @navigate="appStore.onSetSidebarOpen(false)" />
  </ElDrawer>
</ElContainer>
```

Footer는 `flex-col sm:flex-row`로 반응형 정렬하며, 기존 저작권·링크 기능을 유지한다.

- [ ] **Step 4: test 통과 확인**

Run: `pnpm exec vitest run test/default-layout.test.ts`

Expected: PASS. 메뉴 버튼, Aside, Drawer, sidebar navigate close를 검증한다.

### Task 3: 전체 검증

**Files:**
- Verify: `app/config/navigation.config.ts`, `app/components/common/AppSidebar.vue`, `app/components/common/AppHeader.vue`, `app/layouts/default.vue`, `test/*.test.ts`

- [ ] **Step 1: 변경 파일 lint 실행**

Run: `pnpm exec eslint app/config/navigation.config.ts app/components/common/AppSidebar.vue app/components/common/AppHeader.vue app/layouts/default.vue test/app-sidebar.test.ts test/default-layout.test.ts`

Expected: PASS.

- [ ] **Step 2: 전체 검증 실행**

Run: `pnpm test; pnpm exec nuxi typecheck; pnpm build; git diff --check`

Expected: 모든 명령 PASS.
