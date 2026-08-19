# Vue Query 공통 컴포저블 설계

## 목적

기존 `app/composables/query/`의 `useGet`, `usePost`, `usePut`, `usePatch`, `useDelete` 호출명을 유지하면서 내부 요청 상태 관리를 `@tanstack/vue-query`로 교체한다. 호출자는 HTTP 요청 정보와 Vue Query 동작 옵션을 함께 전달할 수 있어야 하며, 전역 기본 옵션은 개별 요청에서 안전하게 덮어쓸 수 있어야 한다.

## 범위

- Nuxt 앱에 단일 `QueryClient`를 등록한다.
- 공통 `defaultOptions.queries`와 `defaultOptions.mutations`를 정의한다.
- 기존 HTTP 메서드별 컴포저블의 이름, URL·파라미터·본문 중심 호출 형태를 보존한다.
- 조회 컴포저블에는 `queryOptions`, 변경 컴포저블에는 `mutationOptions`를 추가한다.
- API 전송 관련 옵션은 Vue Query 옵션과 충돌하지 않도록 `fetchOptions`로 분리한다.
- 기존 `execute()` 호출은 조회의 `refetch()`와 변경의 `mutateAsync()`를 감싼 호환 API로 유지한다.
- 입력·응답·오류 타입과 옵션 병합, 키 생성, 요청 함수 동작을 단위 테스트로 검증한다.

이번 범위에는 도메인 API, Pinia store 동기화, 개별 화면의 기존 호출 전환, 개발자 도구 UI 노출은 포함하지 않는다.

## 전역 QueryClient 정책

`app/plugins/vue-query.ts`는 앱당 하나의 `QueryClient`를 만들고 `VueQueryPlugin`으로 등록한다. 기본 옵션은 기존 요청이 자동 재시도·자동 재요청을 하지 않았던 동작을 유지한다. 캐시 데이터의 신선도와 미사용 캐시 보관 기간은 각각 10분으로 고정한다.

```ts
defaultOptions: {
  queries: {
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    staleTime: 10 * 60 * 1_000,
    gcTime: 10 * 60 * 1_000,
  },
  mutations: {
    retry: false,
  },
}
```

`retry`, 모든 `refetchOn*` 옵션, `staleTime`, `gcTime`, 활성화 조건, 성공·오류 콜백, 무효화는 각 호출의 옵션으로 명시할 수 있으며, Vue Query의 표준 병합 규칙에 따라 전역 기본값을 덮어쓴다.

## 컴포저블 인터페이스

### 공통 요청 입력

기존 `options`는 `fetchOptions`로 이름을 바꾼다. `fetchOptions`에는 `$fetch`에 전달할 HTTP 관련 옵션만 넣는다.

```ts
interface QueryBaseInput<TParams> {
  url: string;
  params?: TParams;
  headers?: HeadersInit;
  fetchOptions?: QueryFetchOptions;
}
```

### 조회

`useGet`은 URL과 파라미터에서 안정적인 기본 키를 생성한다. 호출자가 `queryOptions.queryKey`를 제공하면 그것을 우선한다. `queryOptions.queryFn`을 제공하면 내부 `$fetch` 기반 기본 함수 대신 그것을 사용한다.

```ts
const projects = useGet<ProjectListResponse>({
  url: '/api/projects',
  params: { page: 1 },
  queryOptions: {
    queryKey: ['projects', { page: 1 }],
    staleTime: 30_000,
    enabled: isReady,
  },
});
```

반환값은 Vue Query 조회 결과를 기반으로 하며 `data`, `error`, `status`, `isPending`, `refetch`를 제공한다. 기존 사용성을 위해 `pending`은 `isPending`의 별칭으로, `execute()`는 `refetch()` 결과의 `data`를 반환하는 별칭으로 둔다. `reset()`은 해당 키의 캐시를 제거하지 않고 현재 observer 상태를 초기화한다.

### 변경

`usePost`, `usePut`, `usePatch`, `useDelete`는 URL·파라미터·본문을 기본 `mutationFn`으로 사용한다. `mutationOptions.mutationFn`이 주어지면 그것이 우선한다.

```ts
const createProject = usePost<ProjectResponse, CreateProjectBody>({
  url: '/api/projects',
  mutationOptions: {
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['projects'],
    }),
  },
});
```

반환값은 Vue Query 변경 결과를 기반으로 하며 `data`, `error`, `status`, `isPending`, `mutate`, `mutateAsync`, `reset`을 제공한다. 기존 `pending`은 `isPending`의 별칭이며, `execute(overrides)`는 `mutateAsync(overrides)`의 호환 별칭이다. `overrides`는 원래 입력과 병합하고, 헤더는 원래 헤더와 override 헤더를 병합한다.

## 오류 및 SSR 경계

기본 요청 함수는 반드시 Nuxt의 `$fetch`를 사용하고 실패 값을 기존 `ApiError` 형태로 정규화한다. 인증 쿠키가 필요한 브라우저 요청에는 브라우저의 same-origin cookie 전달을 유지한다. 서버 렌더링에서 데이터를 미리 가져오는 것은 개별 화면이 `prefetchQuery` 또는 `useQuery` 수명주기를 명시적으로 선택하는 후속 범위이며, 이 공통 계층은 QueryClient 상태의 수동 직렬화·복원을 추가하지 않는다.

## 파일 책임

- `app/plugins/vue-query.ts`: QueryClient 생성, 전역 기본 옵션, Vue Query 플러그인 등록
- `app/composables/query/types.ts`: HTTP 요청 입력과 Vue Query 옵션을 조합한 공개 타입
- `app/composables/query/shared.ts`: 기본 키 생성, 요청 병합, API 오류 정규화, 공통 fetch 함수
- `app/composables/query/useGet.ts`: 기본 queryFn과 `useQuery` 호환 래퍼
- `app/composables/query/createMutation.ts`: 기본 mutationFn과 `useMutation` 호환 래퍼
- `app/composables/query/usePost.ts`, `usePut.ts`, `usePatch.ts`, `useDelete.ts`: HTTP 메서드 지정 래퍼
- `test/composables/query/*.test.ts`: 전역 옵션, 입력 병합, 키·옵션 우선순위, 호환 API 검증

## 완료 기준

- Nuxt가 QueryClient를 한 번만 등록한다.
- 모든 컴포저블이 Vue Query의 reactive 상태와 기존 `pending`·`execute()` 호환 API를 제공한다.
- 전역 기본 옵션과 각 호출의 `queryOptions`·`mutationOptions` 덮어쓰기가 작동한다.
- 사용자 정의 key·queryFn·mutationFn이 기본 동작보다 우선한다.
- `fetchOptions`와 Vue Query 옵션이 섞이지 않는다.
- 대상 Vitest, ESLint, `vue-tsc`, `pnpm build`, `git diff --check`를 통과한다.
