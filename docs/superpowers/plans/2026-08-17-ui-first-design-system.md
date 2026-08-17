# Omninode UI-First Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fixture-driven, consistent UI for Omninode's 58 in-scope routes before connecting unfinished domain functions to live APIs.

**Architecture:** Page files remain responsible for meta, layout selection, and rendering-component composition. Six context-specific layouts are built over shared Element Plus and CVA components; route families consume one relationship-preserving UI fixture. Root `TODO.md` remains the functional ledger, while `docs/UI-DESIGN-TODO.md` tracks visual completion.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Element Plus, Tailwind CSS 4, class-variance-authority, Pinia, Vue Test Utils, Vitest.

## Global Constraints

- Preserve the existing `/signin` route; do not create `/login`.
- Do not add API calls, database changes, migrations, or permission-policy changes in UI-only tasks.
- Exclude `/`, `/about`, and `/settings` from the UI transition.
- Use `cva` and `cn()` for rendering/UI components; pages compose components and call `useSetMeta`.
- Use `storeToRefs` from `pinia` for reactive Pinia state and getters.
- Use Element Plus form controls through shared UI components; primary is blue and surfaces are light and neutral.
- Preserve unrelated worktree changes, including the current unstaged `app/layouts/default.vue` change, until its owner and scope are confirmed.
- Commit completed UI stages with `yyyy MMdd <type>: <한글 내용>`; do not push.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `app/data/ui-fixture.data.ts` | Typed UI-only project, world, category, template, document, admin, and activity fixtures |
| `app/components/ui/UiPageHeader.vue` | Title, description, breadcrumb, actions, and context slot |
| `app/components/ui/UiStatePanel.vue` | Loading, empty, error, and forbidden presentations |
| `app/components/ui/UiFormField.vue` | Label, required indicator, help text, error text, and Element Plus control slot |
| `app/components/ui/UiStatusBadge.vue` | Text-bearing semantic status badge |
| `app/components/layout/AppHeader.vue` | Context selector, search, account area, and compact navigation trigger |
| `app/components/layout/DocumentSidebar.vue` | Document category tree and current-document navigation |
| `app/components/layout/DashboardSidebar.vue` | Role and context driven dashboard navigation |
| `app/layouts/default.vue` | Document list/detail shell |
| `app/layouts/document-editor.vue` | Document create/edit shell |
| `app/layouts/super-admin-dashboard.vue` | Global administration shell |
| `app/layouts/project-dashboard.vue` | Project management shell |
| `app/layouts/world-dashboard.vue` | World management shell |
| `app/components/docs/*` | Document list, detail, and editor views |
| `app/components/admin/*` | Super-admin dashboard and administrator views |
| `app/components/project/*` | Project dashboard and project-scope work views |
| `app/components/world/*`, `category/*`, `template/*`, `relation/*` | World dashboard work views |
| `test/ui-*.test.ts` | Fixture, layout, state, route composition, and interaction tests |

## Task 1: Safeguard the Worktree and UI Ledger

**Files:**
- Modify: `docs/UI-DESIGN-TODO.md`
- Create: `test/ui-design-ledger.test.ts`

**Consumes:** 58-route scope from `docs/superpowers/specs/2026-08-17-ui-first-design-system-design.md`.

**Produces:** A UI-only progress contract independent from root `TODO.md`.

- [ ] **Step 1: Inspect unrelated changes before editing UI files**

Run: `git status --short` and `git diff -- app/layouts/default.vue`.

Expected: Record existing changes without staging, reverting, or including them in UI-0.

- [ ] **Step 2: Write the ledger regression test**

```ts
it('keeps functional and UI progress ledgers separate', () => {
  const ledger = readFileSync(resolve(process.cwd(), 'docs/UI-DESIGN-TODO.md'), 'utf8');

  expect(ledger).toContain('UI-0');
  expect(ledger).toContain('UI-6');
  expect(ledger).toContain('루트 `TODO.md`');
});
```

- [ ] **Step 3: Run the focused test**

Run: `pnpm exec vitest run test/ui-design-ledger.test.ts`.

Expected: PASS after the ledger exists.

- [ ] **Step 4: Commit this documentation-only stage**

```powershell
git add -- docs/UI-DESIGN-TODO.md test/ui-design-ledger.test.ts
git commit -m "2026 0817 docs: UI 디자인 진행표 추가"
```

## Task 2: Build UI-0 Foundation

**Files:**
- Create: `app/data/ui-fixture.data.ts`, `app/components/ui/UiPageHeader.vue`, `app/components/ui/UiStatePanel.vue`, `app/components/ui/UiFormField.vue`, `app/components/ui/UiStatusBadge.vue`
- Create: `app/components/layout/AppHeader.vue`, `app/components/layout/DocumentSidebar.vue`, `app/components/layout/DashboardSidebar.vue`
- Create: `app/layouts/document-editor.vue`, `app/layouts/super-admin-dashboard.vue`, `app/layouts/project-dashboard.vue`, `app/layouts/world-dashboard.vue`
- Modify: `app/layouts/default.vue`, `app/layouts/auth.vue`, `app/assets/styles/tailwind.css`, `app/assets/styles/colors.css`, `docs/UI-DESIGN-TODO.md`
- Create: `test/ui-fixture.test.ts`, `test/ui-layouts.test.ts`, `test/ui-form-field.test.ts`

**Consumes:** Existing `cn`, CVA conventions, Element Plus, and app auth state.

**Produces:** `UiFixture`, `UiFixtureDocument`, `UiFixtureWorld`, `UiFixtureProject`, `UiFixtureAdmin`, and `uiFixture`; named layouts `default`, `document-editor`, `super-admin-dashboard`, `project-dashboard`, and `world-dashboard`.

- [ ] **Step 1: Write failing fixture and layout tests**

```ts
expect(uiFixture.projects).toHaveLength(3);
expect(uiFixture.documents.some((document) => document.status === 'HIDDEN')).toBe(true);
expect(readFileSync(documentLayoutPath, 'utf8')).toContain('<DocumentSidebar');
expect(readFileSync(dashboardLayoutPath, 'utf8')).toContain('<DashboardSidebar');
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `pnpm exec vitest run test/ui-fixture.test.ts test/ui-layouts.test.ts test/ui-form-field.test.ts`.

Expected: FAIL because the fixture, shared components, and layouts do not exist.

- [ ] **Step 3: Implement the typed fixture and common UI**

```ts
export type UiDocumentStatus = 'PUBLIC' | 'PRIVATE' | 'DRAFT' | 'HIDDEN' | 'DELETED';

export interface UiFixtureDocument {
  id: string;
  worldId: string;
  categoryId: string;
  title: string;
  status: UiDocumentStatus;
  updatedAt: string;
}
```

Implement related fixture references instead of unrelated display counts. Give each shared Vue component a `class?: string` prop merged with `cn()`.

- [ ] **Step 4: Implement six shells and responsive behavior**

Document layout uses `DocumentSidebar`; dashboard layouts use `DashboardSidebar`; auth has no sidebar. On narrow screens, sidebars and right panels collapse behind Element Plus controls.

- [ ] **Step 5: Verify, mark UI-0, and commit**

Run: `pnpm exec vitest run test/ui-fixture.test.ts test/ui-layouts.test.ts test/ui-form-field.test.ts && pnpm lint && pnpm exec vue-tsc --noEmit`.

Commit: `2026 0817 feat: UI 공통 디자인 기반 추가`.

## Task 3: Build UI-1 Document Exploration

**Files:**
- Create: `app/components/docs/DocumentList.vue`, `app/components/docs/DocumentDetail.vue`, `app/components/docs/DocumentMetaPanel.vue`
- Modify: `app/pages/docs/index.vue`, project/world/category document list pages, document detail pages, `docs/UI-DESIGN-TODO.md`
- Create: `test/ui-document-exploration.test.ts`

**Consumes:** `uiFixture.documents`, `DocumentSidebar`, `UiPageHeader`, `UiStatusBadge`, `UiStatePanel`.

**Produces:** Fixture-driven list/detail views under the `default` layout.

- [ ] **Step 1: Write failing document tests**

```ts
expect(wrapper.get('[data-testid="document-table"]').text()).toContain('공개');
expect(wrapper.get('[data-testid="document-meta-panel"]').text()).toContain('최종 수정');
expect(wrapper.get('[data-testid="document-detail"]').text()).toContain(document.title);
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `pnpm exec vitest run test/ui-document-exploration.test.ts`.

Expected: FAIL because document rendering components do not exist.

- [ ] **Step 3: Implement list, detail, filters, and states**

Use `ElTable`, `ElPagination`, `ElSelect`, and `ElInput`. Provide local title query, category/status selection, row navigation, and loading/empty/error fixture modes without API calls.

- [ ] **Step 4: Assign layouts and verify**

Document list and detail routes use `default`; only new/edit routes use `document-editor`.

Run: `pnpm exec vitest run test/ui-document-exploration.test.ts && pnpm lint && pnpm exec vue-tsc --noEmit`.

- [ ] **Step 5: Mark UI-1 and commit**

Commit: `2026 0817 feat: 문서 탐색 UI 추가`.

## Task 4: Build UI-2 Document Editor

**Files:**
- Create: `app/components/docs/DocumentEditor.vue`, `app/components/docs/DocumentOutline.vue`
- Modify: document new/edit page files, `docs/UI-DESIGN-TODO.md`
- Create: `test/ui-document-editor.test.ts`

**Consumes:** `UiFormField`, `uiFixture.templates`, `UiFixtureDocument`.

**Produces:** `DocumentEditor` with `mode: 'create' | 'edit'`.

- [ ] **Step 1: Write failing editor tests**

```ts
await wrapper.get('[data-testid="document-save"]').trigger('click');
expect(wrapper.get('[data-testid="save-feedback"]').text()).toContain('저장 준비');
expect(wrapper.find('[data-testid="document-delete"]').exists()).toBe(true);
```

- [ ] **Step 2: Confirm failure and implement explicit-save UI**

Run: `pnpm exec vitest run test/ui-document-editor.test.ts`.

Use `ElForm`, `ElInput`, `ElSelect`, `ElCheckbox`, and `ElDialog`. Save updates local UI feedback only; it must not send a request or imply persistence.

- [ ] **Step 3: Verify, mark UI-2, and commit**

Run: `pnpm exec vitest run test/ui-document-editor.test.ts && pnpm lint && pnpm exec vue-tsc --noEmit`.

Commit: `2026 0817 feat: 문서 편집 UI 추가`.

## Task 5: Build UI-3 Super-Admin Dashboard

**Files:**
- Create: `app/components/admin/SuperAdminDashboard.vue`, `app/components/admin/AdminManagementView.vue`
- Modify: `app/pages/admin/index.vue`, `app/pages/admins/index.vue`, administrator detail/edit pages, `docs/UI-DESIGN-TODO.md`
- Create: `test/ui-super-admin-dashboard.test.ts`

**Consumes:** `uiFixture.projects`, `uiFixture.worlds`, `uiFixture.documents`, `uiFixture.admins`, `UiPageHeader`, `UiStatusBadge`.

**Produces:** Global dashboard and administrator management views using `super-admin-dashboard`.

- [ ] **Step 1: Write failing super-admin tests**

```ts
expect(wrapper.get('[data-testid="system-kpi"]').text()).toContain('전체 프로젝트');
expect(wrapper.get('[data-testid="recent-documents"]').text()).toContain('숨김');
expect(wrapper.get('[data-testid="admin-table"]').findAll('tr').length).toBeGreaterThan(1);
```

- [ ] **Step 2: Confirm failure and implement global views**

Run: `pnpm exec vitest run test/ui-super-admin-dashboard.test.ts`.

Represent hidden documents in lists while replacing sensitive title/category fixture content with redacted labels. Management actions open local Element Plus dialogs only.

- [ ] **Step 3: Verify, mark UI-3, and commit**

Run: `pnpm exec vitest run test/ui-super-admin-dashboard.test.ts && pnpm lint && pnpm exec vue-tsc --noEmit`.

Commit: `2026 0817 feat: 슈퍼 어드민 대시보드 UI 추가`.

## Task 6: Build UI-4 Project Dashboard

**Files:**
- Create: `app/components/project/ProjectDashboard.vue`, `app/components/project/ProjectManagementView.vue`
- Modify: project list/new/dashboard/settings/admins/worlds and project-scope derived-view pages, `docs/UI-DESIGN-TODO.md`
- Create: `test/ui-project-dashboard.test.ts`

**Consumes:** `uiFixture.projects`, `uiFixture.worlds`, `uiFixture.documents`, `DashboardSidebar`.

**Produces:** Project-scope dashboard work views using `project-dashboard`.

- [ ] **Step 1: Write failing project dashboard tests**

```ts
expect(wrapper.get('[data-testid="project-context"]').text()).toContain(project.name);
expect(wrapper.get('[data-testid="project-world-list"]').text()).toContain(world.name);
expect(wrapper.get('[data-testid="project-quick-actions"]').text()).toContain('월드 생성');
```

- [ ] **Step 2: Confirm failure and implement project views**

Run: `pnpm exec vitest run test/ui-project-dashboard.test.ts`.

Render project list, create form, dashboard, settings, manager assignment, world list, documents, templates, categories, relationships, timeline, search, recent, favorites, activity, and trash as `project-dashboard` work views. Use fixture filtering and local dialogs only.

- [ ] **Step 3: Verify, mark UI-4, and commit**

Run: `pnpm exec vitest run test/ui-project-dashboard.test.ts && pnpm lint && pnpm exec vue-tsc --noEmit`.

Commit: `2026 0817 feat: 프로젝트 대시보드 UI 추가`.

## Task 7: Build UI-5 World Dashboard

**Files:**
- Create: `app/components/world/WorldDashboard.vue`, `app/components/category/CategoryManagementView.vue`, `app/components/template/TemplateManagementView.vue`, `app/components/relation/RelationManagementView.vue`, `app/components/world/WorldDerivedView.vue`
- Modify: world new/dashboard/settings and all world category/template/relation/derived-view pages, `docs/UI-DESIGN-TODO.md`
- Create: `test/ui-world-dashboard.test.ts`, `test/ui-category-template.test.ts`

**Consumes:** `uiFixture.worlds`, `uiFixture.categories`, `uiFixture.templates`, `uiFixture.relationTypes`, `uiFixture.documents`.

**Produces:** World-scope management views using `world-dashboard`.

- [ ] **Step 1: Write failing world, category, and template tests**

```ts
expect(wrapper.get('[data-testid="world-kpi"]').text()).toContain('문서 수');
expect(wrapper.get('[data-testid="category-tree"]').text()).toContain('인물');
expect(wrapper.get('[data-testid="template-preview"]').text()).toContain('기본 정보');
```

- [ ] **Step 2: Confirm failure and implement world work views**

Run: `pnpm exec vitest run test/ui-world-dashboard.test.ts test/ui-category-template.test.ts`.

Use `ElTree`, `ElTreeSelect`, `ElTable`, `ElTabs`, `ElDrawer`, and `ElDialog`. Category and template editing remain inside `world-dashboard`; relation types, relations, timeline, search, recent, favorites, activity, and trash use focused work views in the same shell.

- [ ] **Step 3: Verify, mark UI-5, and commit**

Run: `pnpm exec vitest run test/ui-world-dashboard.test.ts test/ui-category-template.test.ts && pnpm lint && pnpm exec vue-tsc --noEmit`.

Commit: `2026 0817 feat: 월드 대시보드 UI 추가`.

## Task 8: Build UI-6 Account and Permission Views

**Files:**
- Modify: `app/components/auth/SigninForm.vue`, `app/components/auth/AccountProfile.vue`, `app/components/auth/PasswordChangeForm.vue`, `app/components/admin/AdminPermissionRequestForm.vue`, `app/components/project/ProjectAdminManagement.vue`, matching page files, `docs/UI-DESIGN-TODO.md`
- Create: `test/ui-account-permission.test.ts`

**Consumes:** `UiFormField`, `UiStatePanel`, `uiFixture.admins`, `uiFixture.projects`.

**Produces:** Focused auth screens and project-dashboard permission forms without changing authentication behavior.

- [ ] **Step 1: Write failing account and permission form tests**

```ts
expect(wrapper.get('[data-testid="signin-form"]').text()).toContain('이메일');
expect(wrapper.get('[data-testid="permission-summary"]').text()).toContain('권한 요약');
expect(wrapper.get('[data-testid="form-error"]').exists()).toBe(true);
```

- [ ] **Step 2: Confirm failure and implement visual form structure**

Run: `pnpm exec vitest run test/ui-account-permission.test.ts`.

Keep live signin, account, password, and permission request behavior intact. Improve field structure, validation display, permission summaries, submit-disabled state, and dialogs without changing endpoint inputs or auth navigation.

- [ ] **Step 3: Run full UI verification, mark UI-6, and commit**

Run: `pnpm test && pnpm lint && pnpm exec vue-tsc --noEmit && pnpm build`.

Expected: PASS, or report any pre-existing unrelated failure separately.

Commit: `2026 0817 feat: 계정과 권한 UI 추가`.

## Plan Self-Review

| Spec requirement | Plan coverage |
| --- | --- |
| 58-route UI-only scope and excluded paths | Global constraints and Tasks 3–8 |
| Six context layouts | Task 2 |
| Shared tables, states, badges, and form elements | Task 2 |
| Relationship-preserving fixture | Task 2 |
| Document list/detail and separate editor layout | Tasks 3–4 |
| Super-admin, project, and world dashboards | Tasks 5–7 |
| Account and permission views | Task 8 |
| Separate UI ledger and functional TODO preservation | Task 1 |
| Focused tests plus lint, type check, and build | Tasks 2–8 |

The plan names the layout, fixture, and test contracts consumed by each stage. It introduces no API or database work.
