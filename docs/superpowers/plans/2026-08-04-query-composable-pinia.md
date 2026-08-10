# Query Composable 및 Pinia 기본 구조 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 수동 실행 중심의 일관된 API query composable 계약과 최소 Pinia setup store 템플릿을 제공한다.

**Architecture:** GET은 Nuxt `useFetch`를 사용하되 기본 자동 실행을 끄고 `immediate: true`일 때만 SSR 요청을 수행한다. Mutation은 공통 factory로 POST, PUT, PATCH, DELETE의 상태·병합·오류 처리를 통일하고, 각 공개 composable은 HTTP method만 결정한다. Pinia는 API 요청 상태와 분리된 앱 공통 상태 템플릿으로 제공한다.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, ofetch, Pinia, Vitest

## Global Constraints

- GET은 `url`, `params`, `headers`, `options`, `immediate`만 받고 body를 허용하지 않는다.
- POST, PUT, PATCH, DELETE는 하나의 options 객체로 `url`, `params`, `body`, `headers`, `options`를 받는다.
- 모든 공개 query composable은 `data`, `error`, `status`, `pending`, `execute`, `reset`을 가진 같은 반환 객체를 제공한다.
- `immediate` 기본값은 `false`이며, `true`를 명시한 GET만 최초 SSR 요청을 실행한다.
- DELETE body는 다건 삭제 ID 목록과 삭제 옵션을 전달할 수 있다.
- API 요청의 data, error, pending은 Pinia에 저장하지 않는다.
- Pinia store는 setup store를 사용하고 도메인 상태가 생기면 별도 `*.store.ts` 파일로 분리한다.
- 커밋과 푸시는 마스터가 별도로 요청할 때만 수행한다.

---

### Task 1: 공통 query 타입과 요청 상태 계약 정비

**Files:**
- Modify: `app/composables/query/types.ts`
- Modify: `app/composables/query/shared.ts`
- Modify: `test/query-shared.test.ts`

**Interfaces:**
- Produces: `GetQueryInput<TParams>`, `MutationQueryInput<TBody, TParams>`, `QueryResult<TData, TInput>`, `QueryStatus`, `ApiError`
- Produces: `mergeQueryInput`, `createQueryState`, `createQueryResult`, `normalizeApiError`
- Consumes: ofetch `FetchOptions<'json'>`, Vue `Ref` and `shallowRef`

- [ ] **Step 1: 공통 계약 검증용 failing test 작성**

`test/query-shared.test.ts`를 프로젝트 ESLint 형식으로 정리하고 아래 테스트를 추가한다.

```ts
it('keeps an explicitly supplied null body when merging mutation overrides', () => {
  const merged = mergeQueryInput(
    {
      url: '/api/items',
      body: {
        ids: [ 'item-1' ],
      },
    },
    {
      body: null,
    },
  );

  expect(merged.body).toBeNull();
});

it('merges default and override record headers', () => {
  const merged = mergeQueryInput(
    {
      url: '/api/items',
      headers: {
        Authorization: 'Bearer token',
      },
    },
    {
      headers: {
        'X-Request-ID': 'request-1',
      },
    },
  );

  expect(merged.headers).toEqual({
    Authorization: 'Bearer token',
    'X-Request-ID': 'request-1',
  });
});
```

- [ ] **Step 2: failing test 실행**

Run: `pnpm exec vitest run test/query-shared.test.ts`

Expected: FAIL because `mergeQueryInput` is not exported.

- [ ] **Step 3: 메서드별 입력과 공통 반환 타입 작성**

`app/composables/query/types.ts`에 다음 계약을 작성한다. `GetQueryInput`에는 `body`를 선언하지 않는다.

```ts
export type QueryStatus = 'idle' | 'pending' | 'success' | 'error';

export interface GetQueryInput<TParams extends QueryParams = QueryParams>
  extends QueryBaseInput<TParams> {
  immediate?: boolean;
}

export interface MutationQueryInput<
  TBody = QueryBody,
  TParams extends QueryParams = QueryParams,
> extends QueryBaseInput<TParams> {
  body?: TBody;
}

export interface QueryResult<TData, TInput> {
  data: Ref<TData | undefined>;
  error: Ref<ApiError | null>;
  status: Ref<QueryStatus>;
  pending: ComputedRef<boolean>;
  execute: (overrides?: Partial<TInput>) => Promise<TData | undefined>;
  reset: () => void;
}
```

`ApiError`는 `message`, `statusCode`, `data`, `cause`를 가지며, `data`는 `unknown`으로 둔다.

- [ ] **Step 4: 안전한 input·header 병합과 상태 helper 구현**

`app/composables/query/shared.ts`에서 `Object.hasOwn()`으로 override 속성의 존재 여부를 판별한다. null body는 값으로 보존한다. 두 headers가 plain object이면 펼쳐 병합하고, 그 밖의 `HeadersInit` 값은 override 값 전체를 사용한다.

```ts
export function mergeQueryInput<TInput extends QueryBaseInput>(
  input: TInput,
  overrides: Partial<TInput> = {},
): TInput {
  const merged = {
    ...input,
    ...overrides,
  } as TInput;

  if (Object.hasOwn(overrides, 'headers')) {
    merged.headers = mergeHeaders(input.headers, overrides.headers);
  }

  return merged;
}
```

`createQueryState`는 `status`를 `idle`로 만들고, `pending`은 computed로 노출한다. `createQueryResult`는 실행 중인 요청 수를 추적하여 모든 요청이 끝난 뒤에만 `pending`을 false로 만든다. 실패는 `normalizeApiError()`로 변환해 `error`에 저장한다.

동시 요청 상태를 위한 test도 추가한다.

```ts
it('keeps pending true until concurrent executions have all settled', async () => {
  const first = createDeferred<number>();
  const second = createDeferred<number>();
  const query = createQueryResult(async ({ id }: { id: number }) => {
    return id === 1 ? await first.promise : await second.promise;
  });

  const firstExecution = query.execute({ id: 1 });
  const secondExecution = query.execute({ id: 2 });

  expect(query.pending.value).toBe(true);
  first.resolve(1);
  await firstExecution;
  expect(query.pending.value).toBe(true);
  second.resolve(2);
  await secondExecution;
  expect(query.pending.value).toBe(false);
});
```

- [ ] **Step 5: 공통 계약 test 통과 확인**

Run: `pnpm exec vitest run test/query-shared.test.ts`

Expected: PASS. null body, header 병합, reset, 상태 전환 관련 테스트가 모두 통과한다.

### Task 2: GET 및 mutation composable을 통일된 반환 객체로 전환

**Files:**
- Create: `app/composables/query/createMutation.ts`
- Modify: `app/composables/query/useGet.ts`
- Modify: `app/composables/query/usePost.ts`
- Modify: `app/composables/query/usePut.ts`
- Modify: `app/composables/query/usePatch.ts`
- Modify: `app/composables/query/useDelete.ts`
- Modify: `app/composables/query/index.ts`
- Create: `test/query-composables.test.ts`

**Interfaces:**
- Consumes: Task 1의 `GetQueryInput`, `MutationQueryInput`, `QueryResult`, `mergeQueryInput`, `createQueryResult`
- Produces: `useGet`, `usePost`, `usePut`, `usePatch`, `useDelete`의 일관된 `QueryResult`
- Produces: 내부 `createMutation(method, input)` factory

- [ ] **Step 1: composable 계약 failing test 작성**

`test/query-composables.test.ts`에서 `useFetch`와 `$fetch`를 mock한다. GET이 기본적으로 수동 실행이며 `immediate: true`만 자동 실행 옵션을 전달하는지, DELETE가 params/body를 함께 보내는지 검증한다.

```ts
it('keeps GET manual unless immediate is explicitly true', () => {
  useGet({
    url: '/api/items',
  });

  expect(mockUseFetch).toHaveBeenCalledWith('/api/items', expect.objectContaining({
    immediate: false,
  }));

  useGet({
    url: '/api/items',
    immediate: true,
  });

  expect(mockUseFetch).toHaveBeenLastCalledWith('/api/items', expect.objectContaining({
    immediate: true,
  }));
});

it('sends params and a batch body through DELETE execute', async () => {
  const query = useDelete({
    url: '/api/items',
  });

  await query.execute({
    params: {
      projectId: 'project-1',
    },
    body: {
      ids: [ 'item-1', 'item-2' ],
    },
  });

  expect(mockFetch).toHaveBeenCalledWith('/api/items', expect.objectContaining({
    method: 'DELETE',
    query: {
      projectId: 'project-1',
    },
    body: {
      ids: [ 'item-1', 'item-2' ],
    },
  }));
});
```

- [ ] **Step 2: failing test 실행**

Run: `pnpm exec vitest run test/query-composables.test.ts`

Expected: FAIL because current `useGet` does not return the common `QueryResult`, and `createMutation.ts` does not exist.

- [ ] **Step 3: 내부 mutation factory 구현**

`app/composables/query/createMutation.ts`을 작성한다. factory는 HTTP method와 초기 `MutationQueryInput`을 받고, Task 1의 `createQueryResult`에 `$fetch` 실행 함수를 전달한다.

```ts
export function createMutation<
  TResponse,
  TBody = QueryBody,
  TParams extends QueryParams = QueryParams,
>(
  method: MutationMethod,
  input: MutationQueryInput<TBody, TParams>,
): QueryResult<TResponse, MutationQueryInput<TBody, TParams>> {
  return createQueryResult(async (overrides = {}) => {
    const request = mergeQueryInput(input, overrides);

    return await $fetch<TResponse>(request.url, {
      method,
      query: request.params,
      body: request.body,
      headers: request.headers,
      ...request.options,
    });
  });
}
```

- [ ] **Step 4: 공개 mutation wrapper와 GET 구현 교체**

각 mutation file은 아래처럼 factory만 호출하도록 축소한다.

```ts
export function useDelete<
  TResponse,
  TBody extends QueryBody = QueryBody,
  TParams extends QueryParams = QueryParams,
>(input: MutationQueryInput<TBody, TParams>) {
  return createMutation<TResponse, TBody, TParams>('DELETE', input);
}
```

`useGet`은 `GetQueryInput` 하나만 받고, 내부 `shallowRef`에 현재 request input을 보관한다. `useFetch`에는 URL, query, headers를 getter로 넘기고 `watch: false`, `immediate: input.immediate ?? false`를 전달한다. `execute(overrides?)`는 `mergeQueryInput()`으로 현재 input을 갱신한 뒤 `refresh()`를 호출하고 `data.value`를 반환한다. `reset()`은 `clear()`를 호출한다. 이 방식으로 최초 SSR 요청은 유지하면서 GET도 mutation과 동일하게 override 객체를 받는다. GET options에 body를 전달하거나 `as never`를 사용하지 않는다.

- [ ] **Step 5: composable test 통과 확인**

Run: `pnpm exec vitest run test/query-composables.test.ts`

Expected: PASS. GET의 기본 수동 실행, explicit immediate, mutation params/body, 다건 DELETE body가 모두 검증된다.

### Task 3: Pinia 앱 상태 템플릿과 store test 추가

**Files:**
- Create: `app/stores/app.store.ts`
- Create: `test/app-store.test.ts`

**Interfaces:**
- Produces: `useAppStore`
- Produces: `isSidebarOpen`, `reset()`을 가진 app-level setup store
- Consumes: Pinia `defineStore`, Vue `ref`

- [ ] **Step 1: Pinia store failing test 작성**

`test/app-store.test.ts`에서 테스트 Pinia를 활성화하고, 공통 UI 상태 변경과 reset을 검증한다.

```ts
it('resets common app UI state', () => {
  setActivePinia(createPinia());
  const store = useAppStore();

  store.isSidebarOpen = true;
  store.reset();

  expect(store.isSidebarOpen).toBe(false);
});
```

- [ ] **Step 2: failing test 실행**

Run: `pnpm exec vitest run test/app-store.test.ts`

Expected: FAIL because `~/stores/app.store` does not exist.

- [ ] **Step 3: 최소 setup store 템플릿 구현**

`app/stores/app.store.ts`에 API data/pending/error 없이 공통 UI 상태와 reset만 둔다.

```ts
export const useAppStore = defineStore('app', () => {
  const isSidebarOpen = ref(false);

  function onSetSidebarOpen(value: boolean) {
    isSidebarOpen.value = value;
  }

  function reset() {
    isSidebarOpen.value = false;
  }

  return {
    isSidebarOpen,
    onSetSidebarOpen,
    reset,
  };
});
```

- [ ] **Step 4: Pinia store test 통과 확인**

Run: `pnpm exec vitest run test/app-store.test.ts`

Expected: PASS. state 초기값, action, reset이 검증된다.

### Task 4: 전체 회귀 검증과 템플릿 문서 정합성 확인

**Files:**
- Verify: `app/composables/query/*`
- Verify: `app/stores/app.store.ts`
- Verify: `test/*.test.ts`
- Verify: `docs/superpowers/specs/2026-08-04-query-composable-pinia-design.md`

**Interfaces:**
- Consumes: Task 1~3의 query 및 Pinia 계약
- Produces: 검증된 재사용 템플릿 상태

- [ ] **Step 1: 변경 파일 ESLint 실행**

Run: `pnpm exec eslint app/composables/query app/stores/app.store.ts test/query-shared.test.ts test/query-composables.test.ts test/app-store.test.ts`

Expected: PASS.

- [ ] **Step 2: 전체 unit test 실행**

Run: `pnpm test`

Expected: PASS. 기존 메타데이터 test와 신규 query/store test가 모두 통과한다.

- [ ] **Step 3: Nuxt typecheck 실행**

Run: `pnpm exec nuxi typecheck`

Expected: PASS.

- [ ] **Step 4: production build 실행**

Run: `pnpm build`

Expected: PASS.

- [ ] **Step 5: diff 공백 및 범위 확인**

Run: `git diff --check; git status --short`

Expected: 공백 오류가 없고, 변경 파일이 query composable, Pinia store, tests, 설계·계획 문서 범위에 한정된다.
