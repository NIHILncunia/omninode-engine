# Vue Query 공통 컴포저블 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 기존 HTTP 메서드별 컴포저블 호출명을 유지하면서 $fetch 기반 요청을 Vue Query의 캐시·상태·옵션 모델로 전환한다.

**Architecture:** app/plugins/vue-query.ts가 하나의 QueryClient와 전역 기본값을 제공한다. query/types.ts는 HTTP 입력과 Vue Query 옵션을 분리하고, shared.ts는 $fetch 요청·오류·키 생성을 담당한다. useGet과 createMutation은 기본 함수를 만들되 호출자가 제공한 Vue Query 옵션을 우선한다.

**Tech Stack:** Nuxt 4, Vue 3, @tanstack/vue-query 5, $fetch, TypeScript, Vitest

**Spec:** docs/superpowers/specs/2026-08-20-vue-query-composable-design.md

## Global Constraints

- 기본 HTTP 요청 함수는 반드시 Nuxt $fetch를 사용한다.
- 기본 조회·변경 재시도는 false다.
- 기본 조회의 mount·window focus·reconnect·interval 재요청은 모두 false다.
- 기본 staleTime과 gcTime은 각각 10 * 60 * 1_000이다.
- 호출자의 queryOptions와 mutationOptions는 전역 기본값과 내부 기본 함수를 덮어쓸 수 있어야 한다.
- 기존 useGet, usePost, usePut, usePatch, useDelete, pending, execute() 호출 계약을 보존한다.
- HTTP 전송 옵션은 fetchOptions에만 둔다. any를 사용하지 않는다.

---

### Task 1: QueryClient 전역 정책과 플러그인 계약

**Files:**

- Create: app/plugins/vue-query.ts
- Create: test/composables/query/vue-query-plugin.test.ts

**Interfaces:**

- Produces: queryClientDefaultOptions, Nuxt 앱에 등록되는 단일 QueryClient
- Consumes: QueryClient, VueQueryPlugin from @tanstack/vue-query

- [ ] **Step 1: 실패하는 기본 옵션 계약 테스트를 작성한다.**

    import { expect, it } from 'vitest';
    import { queryClientDefaultOptions } from '../../../app/plugins/vue-query';

    it('자동 재요청을 끄고 stale 및 gc 시간을 10분으로 둔다', () => {
      expect(queryClientDefaultOptions).toMatchObject({
        queries: {
          retry: false,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          refetchInterval: false,
          refetchIntervalInBackground: false,
          staleTime: 600_000,
          gcTime: 600_000,
        },
        mutations: { retry: false },
      });
    });

- [ ] **Step 2: 플러그인 export 부재로 테스트가 실패하는지 확인한다.**

Run: pnpm test -- test/composables/query/vue-query-plugin.test.ts

Expected: FAIL because app/plugins/vue-query.ts does not exist.

- [ ] **Step 3: 플러그인과 공개 기본 옵션을 구현한다.**

    import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';

    export const queryClientDefaultOptions = {
      queries: {
        retry: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
        refetchIntervalInBackground: false,
        staleTime: 10 * 60 * 1_000,
        gcTime: 10 * 60 * 1_000,
      },
      mutations: { retry: false },
    } as const;

    export default defineNuxtPlugin((nuxtApp) => {
      const queryClient = new QueryClient({ defaultOptions: queryClientDefaultOptions });
      nuxtApp.vueApp.use(VueQueryPlugin, { queryClient });
    });

- [ ] **Step 4: 테스트를 통과시킨다.**

Run: pnpm test -- test/composables/query/vue-query-plugin.test.ts

Expected: PASS.

- [ ] **Step 5: 이 작업의 파일만 커밋한다.**

    git add app/plugins/vue-query.ts test/composables/query/vue-query-plugin.test.ts
    git commit -m "2026 0820 feat: Vue Query 전역 설정 추가"

### Task 2: 타입·요청 병합·기본 키 계약

**Files:**

- Modify: app/composables/query/types.ts
- Modify: app/composables/query/shared.ts
- Create: test/composables/query/shared.test.ts

**Interfaces:**

- Produces: GetQueryInput, MutationQueryInput, QueryResult, MutationResult, createDefaultQueryKey, executeFetch
- Consumes: Vue Query UseQueryOptions, UseMutationOptions, QueryKey and ofetch FetchOptions

- [ ] **Step 1: 기본 키와 override 병합의 실패하는 테스트를 작성한다.**

    import { expect, it } from 'vitest';
    import { createDefaultQueryKey, mergeQueryInput } from '../../../app/composables/query/shared';

    it('기본 조회 키에 메서드, URL, 파라미터를 넣는다', () => {
      expect(createDefaultQueryKey('/api/projects', { page: 2 }))
        .toEqual(['GET', '/api/projects', { page: 2 }]);
    });

    it('execute override 헤더는 기존 헤더와 병합한다', () => {
      expect(mergeQueryInput({
        url: '/api/projects',
        headers: { authorization: 'Bearer old' },
      }, {
        headers: { 'x-request-id': 'request-1' },
      })).toMatchObject({
        headers: { authorization: 'Bearer old', 'x-request-id': 'request-1' },
      });
    });

- [ ] **Step 2: 새 함수와 타입이 없어 실패하는지 확인한다.**

Run: pnpm test -- test/composables/query/shared.test.ts; pnpm exec vue-tsc --noEmit

Expected: FAIL because createDefaultQueryKey and Vue Query-compatible input types are absent.

- [ ] **Step 3: HTTP 입력과 Vue Query 옵션을 분리한 타입을 구현한다.**

    export interface QueryBaseInput<TParams extends QueryParams = QueryParams> {
      url: string;
      params?: TParams;
      headers?: QueryHeaders;
      fetchOptions?: QueryFetchOptions;
    }

    export interface GetQueryInput<TResponse, TParams extends QueryParams = QueryParams>
      extends QueryBaseInput<TParams> {
      queryOptions?: Partial<UseQueryOptions<TResponse, ApiError, TResponse, QueryKey>>;
    }

    export interface MutationQueryInput<TResponse, TBody, TParams extends QueryParams = QueryParams>
      extends QueryBaseInput<TParams> {
      body?: TBody;
      mutationOptions?: Partial<
        UseMutationOptions<TResponse, ApiError, Partial<QueryRequestInput<TBody, TParams>>>
      >;
    }

QueryResult와 MutationResult는 Vue Query 결과 타입을 조합하고 기존 pending, execute를 추가한다. QueryRequestInput의 기존 options도 fetchOptions로 바꾼다.

- [ ] **Step 4: 공통 키와 $fetch 요청 함수를 구현한다.**

    export function createDefaultQueryKey<TParams extends QueryParams>(
      url: string,
      params?: TParams,
    ): QueryKey {
      return ['GET', url, params ?? {}];
    }

    export async function executeFetch<TResponse>(
      request: NormalizedRequest,
    ): Promise<TResponse> {
      return await $fetch<TResponse>(request.url, {
        method: request.method,
        query: request.query,
        body: request.body,
        headers: request.headers,
        ...request.fetchOptions,
      });
    }

mergeQueryInput은 override의 fetchOptions를 교체하고 plain object 헤더만 병합한다. normalizeApiError는 $fetch 오류의 message, statusCode, data, cause를 유지한다.

- [ ] **Step 5: 공통 함수 테스트·타입 검사를 통과시키고 커밋한다.**

Run: pnpm test -- test/composables/query/shared.test.ts; pnpm exec vue-tsc --noEmit

Expected: PASS.

    git add app/composables/query/types.ts app/composables/query/shared.ts test/composables/query/shared.test.ts
    git commit -m "2026 0820 refactor: 쿼리 요청 타입과 공통 함수 전환"

### Task 3: useGet의 Vue Query 전환

**Files:**

- Modify: app/composables/query/useGet.ts
- Create: test/composables/query/useGet.test.ts

**Interfaces:**

- Consumes: createDefaultQueryKey, executeFetch, mergeQueryInput, GetQueryInput
- Produces: useGet<TResponse, TParams>(input), Vue Query state plus pending, execute, reset

- [ ] **Step 1: 기본 요청과 옵션 덮어쓰기의 실패하는 테스트를 작성한다.**

    it('기본 queryFn은 $fetch를 호출하고 execute는 데이터를 반환한다', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ list: [] });
      vi.stubGlobal('$fetch', fetchMock);
      const result = useGet<{ list: string[] }>({ url: '/api/projects' });

      await expect(result.execute()).resolves.toEqual({ list: [] });
      expect(fetchMock).toHaveBeenCalledWith('/api/projects', expect.objectContaining({
        method: 'GET',
      }));
    });

    it('호출자 queryKey와 queryFn은 내부 기본값을 덮어쓴다', async () => {
      const queryFn = vi.fn().mockResolvedValue({ list: ['custom'] });
      const result = useGet<{ list: string[] }>({
        url: '/api/projects',
        queryOptions: { queryKey: ['custom-projects'], queryFn, enabled: false },
      });

      await result.execute();
      expect(queryFn).toHaveBeenCalledOnce();
    });

테스트 helper는 createApp과 VueQueryPlugin으로 독립 QueryClient를 제공하고 각 테스트 후 queryClient.clear(), vi.unstubAllGlobals()를 실행한다.

- [ ] **Step 2: 기존 useFetch 구현이 이 계약을 만족하지 않아 실패하는지 확인한다.**

Run: pnpm test -- test/composables/query/useGet.test.ts

Expected: FAIL because current wrapper does not accept queryOptions or return Vue Query state.

- [ ] **Step 3: reactive 입력과 useQuery 래퍼를 구현한다.**

    const requestInput = shallowRef(input);
    const options = computed(() => {
      const request = requestInput.value;
      const callerOptions = request.queryOptions ?? {};

      return {
        ...callerOptions,
        queryKey: callerOptions.queryKey ?? createDefaultQueryKey(request.url, request.params),
        queryFn: callerOptions.queryFn ?? (() => executeFetch<TResponse>(
          normalizeRequestInput('GET', request),
        )),
      };
    });
    const query = useQuery(options);

execute(overrides)는 입력을 병합한 뒤 query.refetch()의 data를 반환한다. pending은 query.isPending의 computed 별칭이고, reset()은 query reset을 호출한다. queryOptions는 execute override 대상이 아니며 처음 전달된 정책을 유지한다.

- [ ] **Step 4: fetchOptions, 기본 키, 옵션 덮어쓰기, pending, execute, reset을 검증한다.**

Run: pnpm test -- test/composables/query/useGet.test.ts

Expected: PASS.

- [ ] **Step 5: 이 작업의 파일만 커밋한다.**

    git add app/composables/query/useGet.ts test/composables/query/useGet.test.ts
    git commit -m "2026 0820 refactor: GET 컴포저블을 Vue Query로 전환"

### Task 4: 변경 래퍼의 Vue Query 전환

**Files:**

- Modify: app/composables/query/createMutation.ts
- Modify: app/composables/query/usePost.ts
- Modify: app/composables/query/usePut.ts
- Modify: app/composables/query/usePatch.ts
- Modify: app/composables/query/useDelete.ts
- Modify: app/composables/query/index.ts
- Create: test/composables/query/createMutation.test.ts

**Interfaces:**

- Consumes: executeFetch, mergeQueryInput, MutationQueryInput, Vue Query useMutation
- Produces: 메서드별 mutation result plus pending, execute, reset

- [ ] **Step 1: 네 HTTP 메서드와 사용자 mutationFn의 실패하는 테스트를 작성한다.**

    it.each(['POST', 'PUT', 'PATCH', 'DELETE'] as const)(
      '%s 요청에 body, params, fetchOptions를 전달한다',
      async (method) => {
        const fetchMock = vi.fn().mockResolvedValue({ id: 1 });
        vi.stubGlobal('$fetch', fetchMock);
        const mutation = createMutation<{ id: number }, { name: string }>(method, {
          url: '/api/projects/1',
          params: { draft: true },
          body: { name: '수정' },
          fetchOptions: { credentials: 'include' },
        });

        await mutation.execute();
        expect(fetchMock).toHaveBeenCalledWith('/api/projects/1', expect.objectContaining({
          method, body: { name: '수정' }, query: { draft: true }, credentials: 'include',
        }));
      },
    );

    it('사용자 mutationFn과 onSuccess가 기본 요청보다 우선한다', async () => {
      const mutationFn = vi.fn().mockResolvedValue({ id: 2 });
      const onSuccess = vi.fn();
      const mutation = usePost<{ id: number }, { name: string }>({
        url: '/api/projects',
        mutationOptions: { mutationFn, onSuccess },
      });

      await mutation.execute({ body: { name: '사용자 정의' } });
      expect(mutationFn).toHaveBeenCalledWith(expect.objectContaining({
        body: { name: '사용자 정의' },
      }));
      expect(onSuccess).toHaveBeenCalledOnce();
    });

- [ ] **Step 2: 기존 수동 상태 구현이 mutationOptions와 Vue Query state를 제공하지 않아 실패하는지 확인한다.**

Run: pnpm test -- test/composables/query/createMutation.test.ts

Expected: FAIL because mutationOptions and useMutation integration are absent.

- [ ] **Step 3: createMutation을 useMutation 기반으로 구현한다.**

    const mutation = useMutation({
      ...input.mutationOptions,
      mutationFn: input.mutationOptions?.mutationFn ?? (async (overrides = {}) => {
        const request = mergeQueryInput(input, overrides);
        return await executeFetch<TResponse>(normalizeRequestInput(method, request));
      }),
    });

    return {
      ...mutation,
      pending: computed(() => mutation.isPending.value),
      execute: async (overrides = {}) => await mutation.mutateAsync(overrides),
    };

usePost, usePut, usePatch, useDelete는 기존 generic 순서와 메서드 지정만 유지한다. 배럴은 공개 타입과 모든 메서드 래퍼를 계속 export한다.

- [ ] **Step 4: 네 메서드, fetchOptions, 헤더 병합, mutationFn·콜백 우선순위, pending·execute 호환성을 통과시킨다.**

Run: pnpm test -- test/composables/query/createMutation.test.ts

Expected: PASS.

- [ ] **Step 5: 이 작업의 파일만 커밋한다.**

    git add app/composables/query/createMutation.ts app/composables/query/usePost.ts app/composables/query/usePut.ts app/composables/query/usePatch.ts app/composables/query/useDelete.ts app/composables/query/index.ts test/composables/query/createMutation.test.ts
    git commit -m "2026 0820 refactor: 변경 컴포저블을 Vue Query로 전환"

### Task 5: 전체 검증과 완료 기록

**Files:**

- Modify: TODO.md
- Create: docs/superpowers/reports/2026-08-20-vue-query-composable-report.md

**Interfaces:**

- Consumes: Task 1~4 구현과 명령 실행 결과
- Produces: 실제 완료 범위, 검증 근거, 커밋, 후속 범위 기록

- [ ] **Step 1: 새 쿼리 테스트 전체를 실행한다.**

Run: pnpm test -- test/composables/query

Expected: PASS.

- [ ] **Step 2: 전체 회귀 검증을 실행한다.**

Run: pnpm test; pnpm lint; pnpm exec vue-tsc --noEmit; pnpm build; git diff --check

Expected: PASS. 기존 무관 실패가 있으면 명령·원인·변경 파일 대상 검증 통과 여부를 완료 리포트에 분리해 적는다.

- [ ] **Step 3: 실제 완료 범위만 TODO와 완료 리포트에 기록한다.**

    ## 완료 범위

    - QueryClient 기본 옵션과 HTTP 메서드 컴포저블의 Vue Query 전환
    - queryOptions, mutationOptions, fetchOptions의 타입·동작 검증

TODO.md의 단계 2.5 관리자 CRUD 점검은 본 범위와 무관하므로 완료로 표시하지 않는다.

- [ ] **Step 4: 완료 기록만 별도 커밋한다.**

    git add TODO.md docs/superpowers/reports/2026-08-20-vue-query-composable-report.md
    git commit -m "2026 0820 docs: Vue Query 컴포저블 완료 기록"
