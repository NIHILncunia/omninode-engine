# 헤더 관리자 로그인 버튼 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 비로그인 방문자에게 헤더 우측의 파란색 관리자 로그인 버튼을 제공하고 `/signin`으로 연결한다.

**Architecture:** `AdminInfoBlock`이 `auth.store`의 `admin` 유무에 따라 로그인 관리자 정보 또는 로그인 버튼을 렌더링한다. `default.vue`는 현재처럼 이 컴포넌트만 배치하며 인증 상태 분기를 알지 않는다.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Pinia, Element Plus, Tailwind CSS 4, Vitest, Vue Test Utils.

## Global Constraints

- 비로그인 버튼은 `ElButton`을 사용하고 `관리자 로그인` 라벨과 톱니 아이콘을 표시한다.
- 버튼은 Nuxt 내부 경로 `/signin`으로 이동한다.
- 검은색 헤더에서 `stone-800` 기본색, `blue-500` hover 상태, keyboard focus ring을 제공한다.
- 로그인 상태에서는 버튼 대신 기존 관리자 이름·이메일을 유지한다.
- 푸터 테마와 광범위한 사이트 재설계는 이번 범위에 포함하지 않는다.

---

### Task 1: 인증 상태별 헤더 액션 구현 및 검증

**Files:**
- Modify: `app/components/common/AdminInfoBlock.vue`
- Modify: `test/admin-info-block.test.ts`

**Interfaces:**
- Consumes: `useAuthStore()`의 `admin: Ref<Admin | null>`.
- Produces: 로그인 시 관리자 정보, 비로그인 시 `/signin` 링크를 포함한 `ElButton`.

- [x] **Step 1: 비로그인 버튼 요구를 고정하는 실패 테스트를 작성한다.**

`test/admin-info-block.test.ts`의 비로그인 테스트를 다음 검증으로 교체한다.

```ts
it('비로그인 상태에서는 관리자 로그인 버튼을 표시한다', () => {
  const auth = useAuthStore();
  auth.onSetUnauthenticated();

  const wrapper = mount(AdminInfoBlock, {
    global: {
      plugins: [pinia],
      stubs: {
        ElButton: { template: '<button><slot /></button>' },
        NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
        UiIcon: { template: '<i :data-icon-name="iconName" />', props: ['iconName'] },
      },
    },
  });

  expect(wrapper.text()).toContain('관리자 로그인');
  expect(wrapper.find('a').attributes('href')).toBe('/signin');
  expect(wrapper.find('[data-icon-name="lucide:settings"]').exists()).toBe(true);
});
```

- [x] **Step 2: 실패 원인이 아직 없는 로그인 버튼인지 확인한다.**

Run: `pnpm exec vitest run test/admin-info-block.test.ts`

Expected: `관리자 로그인` 텍스트 또는 `/signin` 링크를 찾지 못해 실패한다.

- [x] **Step 3: 최소 컴포넌트 분기를 구현한다.**

`app/components/common/AdminInfoBlock.vue`의 템플릿을 로그인 관리자 표시와 비로그인 링크로 나눈다.

```vue
<ElButton
  v-else
  tag="NuxtLink"
  to="/signin"
  type="primary"
  class="border-stone-700! bg-stone-800! text-white! shadow-sm hover:border-blue-500! hover:bg-blue-500! focus-visible:ring-2 focus-visible:ring-blue-300"
>
  <UiIcon icon-name="lucide:settings" class="mr-1 size-4" />
  관리자 로그인
</ElButton>
```

기존 로그인 관리자 `div`에는 `v-if="admin"`을 유지한다. `ElButton`은 `tag="NuxtLink"`으로 내부 링크를 직접 렌더링한다.

- [x] **Step 4: 대상 테스트가 통과하는지 확인한다.**

Run: `pnpm exec vitest run test/admin-info-block.test.ts`

Expected: 로그인·비로그인 상태를 포함한 모든 `AdminInfoBlock` 테스트가 통과한다.

- [x] **Step 5: 변경 범위 검증을 실행한다.**

Run: `pnpm exec vitest run test/admin-info-block.test.ts test/app-sidebar.test.ts && git diff --check`

Expected: 두 테스트 파일이 통과하고 공백 오류가 없다.

- [ ] **Step 6: 완료 기록과 커밋을 작성한다.**

`TODO.md`는 단계 2.5의 실제 완료 항목이 없으므로 변경하지 않는다. 아래 파일만 명시적으로 stage하여 커밋한다.

```text
git add app/components/common/AdminInfoBlock.vue test/admin-info-block.test.ts docs/superpowers/specs/2026-08-17-header-admin-signin-button-design.md docs/superpowers/plans/2026-08-17-header-admin-signin-button.md
git commit -m "2026 0817 feat: 헤더 관리자 로그인 버튼 추가"
```
