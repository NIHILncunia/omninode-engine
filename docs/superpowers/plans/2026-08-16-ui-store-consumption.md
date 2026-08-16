# UI Store 소비 규약 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** UI 컴포넌트가 Pinia store 상태는 `storeToRefs`, 액션은 store 구조 분해로 필요한 항목만 소비하도록 통일한다.

**Architecture:** store 인스턴스는 액션 호출의 원본으로 유지한다. 반응형 상태와 getter만 `storeToRefs`에서 꺼내고, template·computed·이벤트 함수의 직접 store 멤버 접근을 제거한다. 미들웨어·store 정의·테스트는 변경하지 않는다.

**Tech Stack:** Nuxt 4, Vue 3, Pinia, Vue Query, Vitest, ESLint, TypeScript

## Global Constraints

- 적용 범위는 `app/components/`의 Pinia store 소비 컴포넌트다.
- 반응형 상태·getter는 `storeToRefs(store)`에서 필요한 값만 구조 분해한다.
- 액션은 store 인스턴스에서 필요한 함수만 구조 분해한다.
- 기존 테스트 파일은 유지하고 이번 규약 전환 대상에서 제외한다.
- Vue Query의 API 조회 및 `onSuccess` store 동기화 구조는 변경하지 않는다.
- `app/middleware/`와 `app/stores/`는 변경하지 않는다.

---

### Task 1: 프로젝트 규약과 auth UI 소비 정비

**Files:**
- Modify: `AGENTS.md`
- Modify: `app/components/common/AppSidebar.vue`
- Modify: `app/components/common/AdminInfoBlock.vue`
- Modify: `app/components/auth/SigninForm.vue`
- Modify: `app/components/auth/PasswordChangeForm.vue`
- Modify: `app/components/auth/AccountProfile.vue`

**Interfaces:**
- Consumes: `useAuthStore(): AuthStore`, `storeToRefs(auth)`
- Produces: `admin`, `status`, `errorMessage`, `isLoading` refs and `onSignin`, `onChangePassword`, `onSignOut` actions

- [x] **Step 1: 테스트 제외 범위를 확인한다.**

기존 테스트 파일은 유지하고 수정하지 않는다. 현재 작업 트리의 헤더 테스트가 실제 `AdminInfoBlock` 전환 전의 파일명을 참조하는 실패는 이번 UI 규약 범위에서 수정하지 않는다.

- [x] **Step 2: AGENTS.md에 UI Store 소비 규칙을 추가한다.**

`## 상태, 데이터, 서버`에 상태와 액션의 구조 분해 예시를 넣고, UI 컴포넌트에서 직접 `store.member` 접근을 금지한다고 명시한다.

- [x] **Step 3: auth UI 컴포넌트를 최소 변경으로 정리한다.**

각 파일에서 아래 패턴을 적용한다.

```ts
const auth = useAuthStore();
const { admin, } = storeToRefs(auth);
const { onSignOut, } = auth;
```

`AppSidebar`는 `admin.value`를 computed에서 사용한다. `AdminInfoBlock`은 template에서 `admin`을 사용한다. 로그인·비밀번호 변경·계정 컴포넌트는 사용하는 상태와 해당 액션만 구조 분해한다.

- [x] **Step 4: auth UI 정적 점검·lint·타입 검사를 실행한다.**

Run: `pnpm lint && pnpm exec vue-tsc --noEmit`

Expected: PASS.

### Task 2: 관리자·권한 UI 소비 정비

**Files:**
- Modify: `app/components/admin/AdminPermissionRequestList.vue`
- Modify: `app/components/admin/AdminPermissionRequestForm.vue`
- Modify: `app/components/admin/AdminList.vue`
- Modify: `app/components/admin/AdminEditForm.vue`
- Modify: `app/components/admin/AdminDetail.vue`
- Modify: `app/components/project/ProjectAdminList.vue`
- Modify: `app/components/project/ProjectAdminInviteForm.vue`

**Interfaces:**
- Consumes: `useAdminPermissionRequestStore`, `useAdministratorStore`, `useProjectAdminStore`, `storeToRefs`
- Produces: `requests`, `list`, `totalElements`, `detailById`, `assignedByProject`, `assignableByProject` refs and `onSet*` actions

- [x] **Step 1: 필요한 상태와 액션을 파일별로 분리한다.**

각 컴포넌트에서 `onSetRequests`, `onSetSubmittedRequest`, `onSetList`, `onSetDetail`, `onSetAssigned`, `onSetAssignable`을 store에서 구조 분해한다. 상태는 각각의 `storeToRefs` 결과에서 구조 분해한다.

- [x] **Step 2: computed와 template을 구조 분해한 상태로 바꾼다.**

```ts
const { detailById, } = storeToRefs(administratorStore);
const admin = computed(() => detailById.value[props.adminId] ?? null);
```

프로젝트별 목록은 `assignedByProject.value[props.projectId]`, `assignableByProject.value[props.projectId]`로 읽는다. request 목록은 template에서 `requests`를 사용한다.

- [x] **Step 3: 전수 정적 점검을 실행한다.**

Run: `rg -n -P "(auth|requestStore|administratorStore|projectAdminStore)\\.(admin|status|errorMessage|isLoading|requests|list|totalElements|detailById|assignedByProject|assignableByProject|on[A-Z])" app/components -g "*.vue"`

Expected: 결과 없음.

- [x] **Step 4: UI 범위 검증을 실행한다.**

Run: `pnpm lint && pnpm exec vue-tsc --noEmit`

Expected: PASS. 전체 테스트는 이번 범위 밖의 기존 헤더 테스트 불일치로 실패하며, 결과를 별도 기록한다.

- [x] **Step 5: TODO와 계획 상태를 반영한다.**

`TODO.md`의 현재 단계 상태를 바꾸지 않는다. 이 계획의 실제 완료한 checkbox만 `[x]`로 표시한다. 단계 2.5가 완료되지 않았으므로 커밋하지 않는다.
