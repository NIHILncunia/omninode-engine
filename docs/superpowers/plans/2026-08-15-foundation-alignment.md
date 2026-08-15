# Omninode 기준 정합화 및 공통 기반 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PostgreSQL·`/signin`·공통 응답 계약을 현행 기준으로 정렬하고, 인증 기능이 의존할 서버·상태·UI의 최소 공통 기반을 제공한다.

**Architecture:** 서버는 `server/utils/createResponse.ts`의 `CreateResponse`로 공통 API 응답을 생성하고, 클라이언트는 응답 타입·코드·메시지 계약만 공유한다. 데이터베이스 연결, API 오류 변환, 인증 상태, 보호 라우트, 공통 상태 UI는 각자 한 책임만 가지며, 실제 인증·도메인 CRUD는 다음 단계에서 구현한다.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Pinia 4, Drizzle ORM 0.45, PostgreSQL (`postgres`), Vitest 4, Element Plus, CVA.

## Global Constraints

- 개발·운영 모두 `server/db/schema/postgresql/index.ts`와 환경별 `DATABASE_URL`을 사용한다. SQLite 스키마·마이그레이션·검증을 새로 만들거나 실행하지 않는다.
- 인증 진입 경로는 `/signin`이며 `app/pages/signin.vue`만 사용한다. `/login` 라우트를 만들지 않는다.
- 표준 응답은 `error`, `data`, `code`, `message`를 포함한다. `error`가 `true`이면 `data`는 `null`이다.
- 페이지 파일은 라우팅·메타·데이터 조합만 담당하고 UI는 `app/components/`에 둔다. 모든 새 UI 컴포넌트는 CVA와 `class` prop + `cn()` 병합을 사용한다.
- 모든 상호작용 함수는 `on<액션><대상>` 형식으로 명명하며 `handle*`를 사용하지 않는다.
- 단계 0에서는 실제 DB 마이그레이션 적용, 관리자 로그인, JWT 발급, 권한 결정, 도메인 CRUD를 구현하지 않는다.
- 기존 무관한 전체 검증 실패는 변경 범위 검증과 분리해 기록한다.

---

## 파일 구조

- `references/옴니노드_UI_API_통합_작업_설계서.md`: PostgreSQL 단일 환경, 공통 응답, `/signin`을 현재 기준으로 기록한다.
- `test/admin-route-scaffolding.test.ts`: 관리자·계정 진입 라우트 존재 계약을 `signin.vue`로 검증한다.
- `server/db/client.ts`: `DATABASE_URL`을 받아 PostgreSQL Drizzle 클라이언트를 만드는 서버 전용 팩터리다.
- `server/utils/createResponse.ts`: 서버 API가 표준 단건·목록·오류 응답을 만드는 서버 전용 유틸리티다.
- `server/utils/api-error.ts`: 안전하게 노출할 API 오류 코드와 HTTP 상태를 정의하고 Nitro 오류로 바꾼다.
- `server/api/health.get.ts`: 데이터베이스를 조회하지 않는 서비스 상태 엔드포인트다.
- `app/stores/auth.store.ts`: 아직 토큰을 저장하지 않고, `unknown | authenticated | unauthenticated` 인증 확인 상태와 이후 인증 API가 쓸 전이 메서드를 제공한다.
- `app/middleware/auth.global.ts`: 공개 경로·인증 필요 경로·비밀번호 변경 전용 경로의 이동 규칙을 적용한다.
- `app/components/common/LoadingState.vue`, `EmptyState.vue`, `ErrorState.vue`: 재사용 가능한 공통 상태 UI다.
- `app/layouts/default.vue`: `AppSidebar`를 레이아웃의 aside에 연결한다.
- `test/foundation-response.test.ts`, `test/foundation-health.test.ts`, `test/auth-store.test.ts`, `test/auth-middleware.test.ts`, `test/common-state-components.test.ts`, `test/default-layout-sidebar.test.ts`: 단계 0 계약을 검증한다.
- `TODO.md`: 단계 0의 완료한 체크 항목, 검증 결과, 다음 시작 지점을 기록한다.

## Task 1: 문서·라우트 기준을 현행 구현과 일치시킨다

**Files:**
- Modify: `references/옴니노드_UI_API_통합_작업_설계서.md`
- Modify: `test/admin-route-scaffolding.test.ts:5-18`
- Modify: `TODO.md`
- Test: `test/admin-route-scaffolding.test.ts`

**Interfaces:**
- Consumes: `app/pages/signin.vue`의 실제 `/signin` 메타 경로와 `CreateResponse`의 표준 필드.
- Produces: 이후 구현자가 SQLite 또는 `/login`을 현행 요구사항으로 오인하지 않는 기준 문서와 라우트 회귀 테스트.

- [x] **Step 1: 라우트 계약이 현재 실패하는 이유를 확인한다.**

Run: `pnpm exec vitest run test/admin-route-scaffolding.test.ts`

Expected: `app/pages/login.vue`가 없다는 실패가 나타난다.

- [x] **Step 2: 라우트 테스트의 단일 구식 경로를 정정한다.**

`adminRouteFiles` 첫 항목을 아래처럼 바꾼다.

```ts
const adminRouteFiles = [
  'app/pages/signin.vue',
  'app/pages/account.vue',
  'app/pages/account/password-change.vue',
] as const;
```

- [x] **Step 3: 통합 설계서의 기준 상태와 시스템 구성을 정정한다.**

다음 의미를 정확히 반영한다.

```md
- 개발·운영은 PostgreSQL 단일 Drizzle 스키마를 공유하고, 환경별 `DATABASE_URL`만 다르다.
- `server/db/schema/`의 현재 구현 경로는 `server/db/schema/postgresql/`이다.
- 로그인 라우트는 `/signin`, 파일은 `app/pages/signin.vue`다.
```

`개발 SQLite 마이그레이션`, `SQLite 개발 DB 재생성`, `SQLite 구조 검사`는 PostgreSQL 생성·마이그레이션 검증으로 교체한다.

- [x] **Step 4: 통합 설계서의 API 응답 예시를 현재 계약으로 정정한다.**

단건·목록·오류 예시는 아래 형태를 사용한다. 목록의 페이지 정보는 `data` 안에 둔다.

```ts
{
  error: false,
  data: { id: 1 },
  code: 'OK',
  message: '요청이 정상적으로 처리되었습니다.',
}

{
  error: false,
  data: {
    list: [], page: 0, pageSize: 20, totalElements: 0,
    numberOfElements: 0, startIndex: 0, endIndex: 0,
    hasPrev: false, hasNext: false, isFirst: true, isLast: true,
    empty: true, totalPages: 0,
  },
  code: 'OK',
  message: '요청이 정상적으로 처리되었습니다.',
}
```

- [x] **Step 5: 정정된 라우트 계약을 통과시킨다.**

Run: `pnpm exec vitest run test/admin-route-scaffolding.test.ts`

Expected: PASS, 2 tests passed.

- [x] **Step 6: 단계 0 대장의 정합화 항목을 갱신한다.**

`TODO.md`에서 완료한 세 항목을 `[x]`로 바꾸고, `현재 상태`의 다음 시작 항목을 Task 2로 갱신한다.

- [ ] **Step 7: 정합화 변경을 커밋한다.**

```text
git add references/옴니노드_UI_API_통합_작업_설계서.md test/admin-route-scaffolding.test.ts TODO.md
git commit -m "2026 0815 docs: 공통 기반 기준 정합화"
```

### Task 2: 서버 표준 응답과 오류 경계를 구현한다

**Files:**
- Create: `server/utils/createResponse.ts`
- Delete: `app/utils/createResponse.ts`
- Create: `server/utils/api-error.ts`
- Create: `test/foundation-response.test.ts`
- Modify: `TODO.md`

**Interfaces:**
- Consumes: `ResponseKey`, `ResponseCode`, `ResponseMessage`, `BaseResponse`, `ListData`, `ListResponseInput` from `app/types/response.types.ts`.
- Produces: `CreateResponse.data<TData>(data, code?, message?)`, `list<TData>(input, code?, message?)`, `error(code?, message?)` and `ApiError(statusCode, code, message)`.

- [x] **Step 1: 서버 응답 계약의 실패 테스트를 작성한다.**

```ts
import { describe, expect, it } from 'vitest';
import { CreateResponse } from '../server/utils/createResponse';

describe('서버 공통 응답', () => {
  it('단건 성공 응답에 표준 필드를 넣는다', () => {
    expect(CreateResponse.data({ id: 1 })).toEqual({
      error: false,
      data: { id: 1 },
      code: 'OK',
      message: '요청이 정상적으로 처리되었습니다.',
    });
  });

  it('빈 목록의 페이지 상태를 정규화한다', () => {
    expect(CreateResponse.list({ list: [], page: -1, pageSize: 0, totalElements: -1 }).data).toMatchObject({
      page: 0, pageSize: 1, totalElements: 0, totalPages: 0, empty: true,
      isFirst: true, isLast: true, hasPrev: false, hasNext: false,
    });
  });
});
```

- [x] **Step 2: 실패 테스트를 실행한다.**

Run: `pnpm exec vitest run test/foundation-response.test.ts`

Expected: FAIL because `server/utils/createResponse.ts` does not exist.

- [x] **Step 3: 클라이언트 응답 유틸리티를 서버 응답 팩터리로 이전한다.**

`server/utils/createResponse.ts`에서 브라우저용 클래스를 직접 import하지 않는다. 같은 타입 계약을 import하고 아래와 같이 독립 객체를 export한다.

```ts
import type { BaseResponse, ListData, ListResponseInput, ResponseKey } from '~/types/response.types';
import { responseCodeData } from '~/data/response-code.data';
import { responseMessageData } from '~/data/response-message.data';

export const CreateResponse = {
  data<TData>(data: TData, code: ResponseKey = 'OK', message: ResponseKey = 'OK'): BaseResponse<TData> {
    return { error: false, data, code: responseCodeData[code], message: responseMessageData[message] };
  },
  error(code: ResponseKey = 'INTERNAL_SERVER_ERROR', message: ResponseKey = 'INTERNAL_SERVER_ERROR'): BaseResponse<null> {
    return { error: true, data: null, code: responseCodeData[code], message: responseMessageData[message] };
  },
};
```

`list`는 `app/utils/createResponse.ts`와 같은 페이지 정규화 규칙을 사용하되, 공통 계산은 `app/types/response.types.ts`에 넣지 않는다. 서버·클라이언트 중복 제거는 실제 두 번째 API 소비 지점이 생길 때 별도 리팩터링으로 결정한다.

- [x] **Step 4: 오류 변환기를 구현한다.**

`server/utils/api-error.ts`에서 `ApiError` 클래스를 만들고, `toApiErrorResponse(error: unknown)`가 표준 오류 본문과 HTTP 상태를 반환하게 한다.

```ts
export class ApiError extends Error {
  constructor(
    public readonly statusCode: 400 | 401 | 403 | 404 | 409 | 500,
    public readonly code: ResponseKey,
    message?: string,
  ) {
    super(message);
  }
}
```

`ResponseKey`에 없는 도메인 코드(`INVALID_INPUT`, `DUPLICATE_NAME`, `CONFLICT`)를 이번 단계에서 추가하지 않는다. 인증·도메인 단계가 해당 오류의 필드 계약을 확정할 때 확장한다.

- [x] **Step 5: 대상 테스트를 통과시킨다.**

Run: `pnpm exec vitest run test/foundation-response.test.ts`

Expected: PASS.

- [ ] **Step 6: TODO를 갱신하고 응답 경계 변경을 커밋한다.**

```text
git add server/utils/createResponse.ts server/utils/api-error.ts test/foundation-response.test.ts TODO.md
git commit -m "2026 0815 feat: 서버 공통 응답 기반 추가"
```

### Task 3: PostgreSQL DB 팩터리와 상태 API를 구현한다

**Files:**
- Create: `server/db/client.ts`
- Create: `server/api/health.get.ts`
- Create: `test/foundation-health.test.ts`
- Modify: `TODO.md`

**Interfaces:**
- Consumes: `DATABASE_URL`, `server/db/schema/postgresql/index.ts`, `CreateResponse`.
- Produces: `createDatabaseClient(databaseUrl: string)` and `GET /api/health` returning `BaseResponse<{ status: 'ok' }>`.

- [x] **Step 1: 상태 API 계약 테스트를 작성한다.**

```ts
import healthHandler from '../server/api/health.get';
import { describe, expect, it } from 'vitest';

describe('상태 API', () => {
  it('DB 연결 없이 서비스 상태를 표준 응답으로 반환한다', async () => {
    await expect(healthHandler({} as never)).resolves.toEqual({
      error: false,
      data: { status: 'ok' },
      code: 'OK',
      message: '요청이 정상적으로 처리되었습니다.',
    });
  });
});
```

- [x] **Step 2: 상태 API 실패를 확인한다.**

Run: `pnpm exec vitest run test/foundation-health.test.ts`

Expected: FAIL because the API handler does not exist.

- [x] **Step 3: PostgreSQL 클라이언트 팩터리를 만든다.**

`server/db/client.ts`은 환경을 읽는 전역 연결을 만들지 않고 URL을 받는다.

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/postgresql';

export const createDatabaseClient = (databaseUrl: string) => {
  const client = postgres(databaseUrl, { prepare: false });
  return drizzle(client, { schema });
};
```

빈 문자열 URL은 `throw new Error('DATABASE_URL is not set.')`로 즉시 거부한다. 연결 테스트 쿼리는 실제 DB 연결 승인을 받은 이후 단계에서만 추가한다.

- [x] **Step 4: API 핸들러를 구현하고 환경 예시를 확인한다.**

`server/api/health.get.ts`는 `defineEventHandler(() => CreateResponse.data({ status: 'ok' as const }))`만 반환한다. `.env.development.example`와 `.env.production.example`에 각각 PostgreSQL `DATABASE_URL` 자리표시자가 있는지 확인하고, 실제 비밀값을 추가·변경하지 않는다.

- [x] **Step 5: 대상 테스트와 타입 검사를 통과시킨다.**

Run: `pnpm exec vitest run test/foundation-health.test.ts`

Expected: PASS.

Run: `pnpm exec vue-tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: TODO를 갱신하고 상태 API 기반을 커밋한다.**

```text
git add server/db/client.ts server/api/health.get.ts test/foundation-health.test.ts TODO.md
git commit -m "2026 0815 feat: PostgreSQL 상태 API 기반 추가"
```

### Task 4: 인증 상태와 보호 경로의 최소 경계를 구현한다

**Files:**
- Create: `app/stores/auth.store.ts`
- Create: `app/middleware/auth.global.ts`
- Create: `test/auth-store.test.ts`
- Create: `test/auth-middleware.test.ts`
- Modify: `TODO.md`

**Interfaces:**
- Consumes: Nuxt `navigateTo`, `useRoute`, Pinia `defineStore`.
- Produces: `useAuthStore()` with `status`, `passwordChangeRequired`, `onSetAuthenticated`, `onSetUnauthenticated`, `onSetPasswordChangeRequired`; route middleware that redirects to `/signin` or `/account/password-change` without calling an auth API.

- [ ] **Step 1: Pinia 상태 전이 테스트를 작성한다.**

```ts
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../app/stores/auth.store';

describe('인증 상태', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('인증과 비밀번호 변경 필요 상태를 독립적으로 전이한다', () => {
    const auth = useAuthStore();
    auth.onSetAuthenticated(false);
    expect(auth.status).toBe('authenticated');
    expect(auth.passwordChangeRequired).toBe(false);
    auth.onSetPasswordChangeRequired();
    expect(auth.passwordChangeRequired).toBe(true);
    auth.onSetUnauthenticated();
    expect(auth.status).toBe('unauthenticated');
  });
});
```

- [ ] **Step 2: 상태 테스트가 실패하는지 확인한다.**

Run: `pnpm exec vitest run test/auth-store.test.ts`

Expected: FAIL because `auth.store.ts` does not exist.

- [ ] **Step 3: 인증 상태 store를 구현한다.**

```ts
export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

export const useAuthStore = defineStore('auth', () => {
  const status = ref<AuthStatus>('unknown');
  const passwordChangeRequired = ref(false);

  const onSetAuthenticated = (requiresPasswordChange: boolean): void => {
    status.value = 'authenticated';
    passwordChangeRequired.value = requiresPasswordChange;
  };

  const onSetUnauthenticated = (): void => {
    status.value = 'unauthenticated';
    passwordChangeRequired.value = false;
  };

  const onSetPasswordChangeRequired = (): void => {
    passwordChangeRequired.value = true;
  };

  return { status, passwordChangeRequired, onSetAuthenticated, onSetUnauthenticated, onSetPasswordChangeRequired };
});
```

- [ ] **Step 4: 보호 경로 규칙을 순수 함수로 먼저 고정한다.**

`app/middleware/auth.global.ts`에 export하는 `getAuthRedirect(path, status, passwordChangeRequired)`를 만들고, 미들웨어는 이 함수 결과만 `navigateTo`한다.

```ts
export const getAuthRedirect = (
  path: string,
  status: AuthStatus,
  passwordChangeRequired: boolean,
): '/signin' | '/account/password-change' | null => {
  const publicPaths = new Set(['/signin', '/about']);
  if (publicPaths.has(path)) return null;
  if (status !== 'authenticated') return '/signin';
  if (passwordChangeRequired && path !== '/account/password-change') return '/account/password-change';
  return null;
};
```

`unknown` 상태는 이번 단계에서 `/signin`으로 이동시킨다. 다음 인증 단계에서 `GET /api/auth/me` 확인 중 화면을 유지하는 비동기 초기화를 설계한다.

- [ ] **Step 5: 상태·경로 테스트를 통과시킨다.**

Run: `pnpm exec vitest run test/auth-store.test.ts test/auth-middleware.test.ts`

Expected: PASS.

- [ ] **Step 6: TODO를 갱신하고 인증 경계 기반을 커밋한다.**

```text
git add app/stores/auth.store.ts app/middleware/auth.global.ts test/auth-store.test.ts test/auth-middleware.test.ts TODO.md
git commit -m "2026 0815 feat: 인증 상태 경계 추가"
```

### Task 5: 공통 상태 UI와 기본 레이아웃 sidebar 연결을 구현한다

**Files:**
- Create: `app/components/common/LoadingState.vue`
- Create: `app/components/common/EmptyState.vue`
- Create: `app/components/common/ErrorState.vue`
- Modify: `app/layouts/default.vue:20-24`
- Create: `test/common-state-components.test.ts`
- Modify: `test/app-sidebar.test.ts`
- Modify: `TODO.md`

**Interfaces:**
- Consumes: Element Plus, `cn`, CVA, `AppSidebar`.
- Produces: class 병합을 지원하는 세 상태 UI와 `<AppSidebar />`를 렌더링하는 기본 레이아웃.

- [ ] **Step 1: 공통 상태 UI와 sidebar 연결의 실패 테스트를 작성한다.**

```ts
import { mount } from '@vue/test-utils';
import EmptyState from '../app/components/common/EmptyState.vue';
import ErrorState from '../app/components/common/ErrorState.vue';
import LoadingState from '../app/components/common/LoadingState.vue';

describe('공통 상태 UI', () => {
  it('로딩·빈 상태·오류 상태를 접근 가능한 텍스트로 렌더링한다', () => {
    expect(mount(LoadingState).text()).toContain('불러오는 중');
    expect(mount(EmptyState, { props: { title: '항목이 없습니다' } }).text()).toContain('항목이 없습니다');
    expect(mount(ErrorState, { props: { title: '불러오지 못했습니다' } }).text()).toContain('불러오지 못했습니다');
  });
});
```

`test/app-sidebar.test.ts`에는 `app/layouts/default.vue`의 템플릿이 `<AppSidebar`를 포함하는지 확인하는 테스트를 추가한다.

- [ ] **Step 2: 실패 테스트를 실행한다.**

Run: `pnpm exec vitest run test/common-state-components.test.ts test/app-sidebar.test.ts`

Expected: FAIL because the state components do not exist and the layout renders literal `aside` text.

- [ ] **Step 3: CVA 기반 상태 컴포넌트를 구현한다.**

각 컴포넌트는 아래 형식을 지킨다.

```ts
const props = defineProps<{
  class?: string;
  title?: string;
  description?: string;
}>();

const cssVariants = cva(['flex', 'flex-col', 'items-center', 'gap-2', 'p-6'], {
  variants: {},
  compoundVariants: [],
  defaultVariants: {},
});
```

`LoadingState`의 기본 제목은 `불러오는 중입니다.`, `EmptyState`는 `표시할 항목이 없습니다.`, `ErrorState`는 `정보를 불러오지 못했습니다.`로 둔다. 오류 재시도 버튼은 콜백 계약이 없는 현재 단계에서 만들지 않는다.

- [ ] **Step 4: 기본 레이아웃의 aside를 실제 sidebar로 교체한다.**

```vue
<ElAside class="border-r border-r-black-300">
  <AppSidebar />
</ElAside>
```

`AppSidebar`의 기존 `navigate` 이벤트는 레이아웃에서 별도 상태를 만들지 않고 그대로 둔다. 메뉴의 실제 권한별 구성은 관리자·권한 단계에서 처리한다.

- [ ] **Step 5: UI 대상 테스트를 통과시킨다.**

Run: `pnpm exec vitest run test/common-state-components.test.ts test/app-sidebar.test.ts`

Expected: PASS.

- [ ] **Step 6: TODO를 갱신하고 UI 기반을 커밋한다.**

```text
git add app/components/common/LoadingState.vue app/components/common/EmptyState.vue app/components/common/ErrorState.vue app/layouts/default.vue test/common-state-components.test.ts test/app-sidebar.test.ts TODO.md
git commit -m "2026 0815 feat: 공통 상태 UI 기반 추가"
```

### Task 6: 단계 0 전체 검증과 진행 대장 완료 처리를 한다

**Files:**
- Modify: `TODO.md`
- Modify: `references/옴니노드_UI_API_통합_작업_설계서.md`

**Interfaces:**
- Consumes: Tasks 1~5의 기준 문서·공통 서버·인증 경계·공통 UI.
- Produces: 검증 근거와 다음 단계(인증·계정)의 시작 지점을 가진 진행 대장.

- [ ] **Step 1: 단계 0 대상 테스트를 묶어 실행한다.**

Run: `pnpm exec vitest run test/admin-route-scaffolding.test.ts test/foundation-response.test.ts test/foundation-health.test.ts test/auth-store.test.ts test/auth-middleware.test.ts test/common-state-components.test.ts test/app-sidebar.test.ts`

Expected: PASS.

- [ ] **Step 2: 전체 검증을 실행한다.**

Run: `pnpm test`

Expected: PASS. 실패하면 실패 파일·원인·단계 0 변경 관련 여부를 `TODO.md`의 `현재 상태`에 기록하고, 관련 실패는 수정 후 다시 실행한다.

Run: `pnpm lint`

Expected: PASS, 또는 기존 실패와 새 변경 파일 무관성이 분리되어 기록된다.

Run: `pnpm exec vue-tsc --noEmit`

Expected: PASS.

Run: `pnpm build`

Expected: PASS.

- [ ] **Step 3: TODO의 단계 0을 완료 처리한다.**

단계 0의 검증 항목을 `[x]`로 바꾸고, `현재 상태`를 아래와 같은 의미로 갱신한다.

```md
- 현재 단계: 1. 인증·계정
- 다음 시작 항목: 인증 API 계약과 쿠키·토큰 보관 방식 확정
- 차단 사항: 없음
```

- [ ] **Step 4: 단계 0 완료 기록을 커밋한다.**

```text
git add TODO.md references/옴니노드_UI_API_통합_작업_설계서.md
git commit -m "2026 0815 docs: 공통 기반 완료 기록"
```

## 계획 자체 점검

- PostgreSQL 단일화, `/signin`, 표준 응답은 Task 1과 Task 2에서 각각 문서·테스트·서버 구현으로 고정한다.
- DB 연결과 상태 API는 Task 3에 한정하며 실제 DB 접속·마이그레이션 적용은 포함하지 않는다.
- 인증 상태와 보호 경로는 Task 4가 담당하며 토큰 발급·검증은 단계 1로 남긴다.
- 공통 상태 UI와 sidebar 연결은 Task 5가 담당한다.
- 각 구현 단위에는 실패 테스트, 구현, 통과 테스트, TODO 갱신, 날짜·타입 규칙을 지키는 커밋이 있다.
- 단계 0 전체 완료 전에는 `TODO.md`의 항목을 완료 처리하지 않는다.
