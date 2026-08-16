# UI Store 소비 규약 설계

## 목적

Vue UI 컴포넌트가 Pinia store의 반응형 상태와 액션을 명확히 구분해 필요한 항목만 사용하도록 통일한다. 상태 구조 분해에 따른 반응성 손실을 막고, 각 컴포넌트의 store 의존 범위를 코드에서 바로 확인할 수 있게 한다.

## 적용 범위

- `AGENTS.md`에 전역 UI Store 소비 규약을 추가한다.
- `app/components/` 아래에서 Pinia store를 소비하는 12개 UI 컴포넌트를 정비한다.
- `app/middleware/`, `app/stores/`, `test/`는 이번 범위에서 제외한다.
- 기존 테스트 파일은 회귀 검증 근거이므로 삭제하거나 완화하지 않는다.

## 규약

각 UI 컴포넌트는 store 인스턴스를 먼저 얻는다.

```ts
const auth = useAuthStore();
```

반응형 상태와 getter는 반드시 `storeToRefs()`의 반환값에서 필요한 항목만 구조 분해한다.

```ts
const {
  admin,
  errorMessage,
  isLoading,
} = storeToRefs(auth);
```

액션은 원본 store 인스턴스에서 필요한 함수만 구조 분해한다.

```ts
const {
  onSignin,
} = auth;
```

템플릿, computed, watch, 이벤트 함수는 구조 분해한 상태·액션만 사용한다. `store.admin`, `store.isLoading`, `store.onSignin()`처럼 store 인스턴스의 멤버를 직접 참조하지 않는다.

## 대상 컴포넌트

| Store | UI 컴포넌트 |
| --- | --- |
| auth | `AppSidebar`, `AdminInfoBlock`, `SigninForm`, `PasswordChangeForm`, `AccountProfile` |
| administrator | `AdminList`, `AdminEditForm`, `AdminDetail` |
| admin-permission-request | `AdminPermissionRequestList`, `AdminPermissionRequestForm` |
| project-admin | `ProjectAdminList`, `ProjectAdminInviteForm` |

`AdminInfoBlock`은 헤더의 인증 관리자 정보 표시를 담당한다. 이번 작업에서는 규약 적용 외 UI 통합·삭제를 수행하지 않는다.

## 구현 방식

- Vue의 `storeToRefs`를 명시적으로 import한다.
- 상태가 필요한 컴포넌트만 `storeToRefs`를 호출한다.
- 액션만 사용하는 컴포넌트는 store 인스턴스에서 액션만 구조 분해하고 `storeToRefs`를 만들지 않는다.
- Vue Query의 `onSuccess`에서 store 동기화 액션을 호출하는 구조는 유지한다.
- local `ref`, Vue Query 결과, props는 이 규약의 대상이 아니며 현재 사용 방식을 유지한다.

## 검증 기준

- 대상 UI 컴포넌트에서 `use*Store()` 직후 상태·액션 직접 참조가 남지 않는다.
- 상태를 쓰는 대상 컴포넌트는 필요한 상태를 `storeToRefs()`에서 구조 분해한다.
- 액션을 쓰는 대상 컴포넌트는 필요한 액션을 store에서 구조 분해한다.
- 기존 단위 테스트, lint, 타입 검사가 통과한다.
