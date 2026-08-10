# Query Composable 및 Pinia 기본 구조 설계

## 목적

Nuxt 기본 데이터 패칭 방식을 유지하면서, 모든 API query composable의 사용 계약을 통일한다. 요청 실행과 응답 상태는 composable이 관리하고, Pinia는 앱 전역 상태에만 사용한다.

## 범위

- `useGet`, `usePost`, `usePut`, `usePatch`, `useDelete`의 공통 입력 및 반환 계약을 정비한다.
- GET은 query params만 전달하며, 명시적으로 `immediate: true`일 때만 최초 요청을 실행한다.
- POST, PUT, PATCH, DELETE는 params와 body를 모두 전달할 수 있다.
- 다건 DELETE는 body에 ID 배열과 부가 삭제 옵션을 담을 수 있다.
- 기본 Pinia setup store 템플릿을 추가한다.
- API 요청의 `data`, `error`, `pending`은 Pinia에 저장하지 않는다.

## 공통 API 계약

모든 composable은 하나의 options 객체를 받고, 같은 query state 객체를 반환한다.

```ts
const query = useGet({
  url: '/api/items',
  params: {
    page: 1,
  },
  immediate: true,
});

const mutation = useDelete({
  url: '/api/items',
  params: {
    projectId: 'project-1',
  },
  body: {
    ids: [ 'item-1', 'item-2' ],
  },
});
```

반환 객체는 다음 필드를 가진다.

```ts
{
  data,
  error,
  status,
  pending,
  execute,
  reset,
}
```

- `status`는 `idle`, `pending`, `success`, `error` 중 하나다.
- `pending`은 `status === 'pending'`의 편의 값이다.
- `execute(overrides?)`는 최초 options와 동일한 구조의 부분 override를 받는다.
- `reset()`은 data와 error를 초기화하고 status를 `idle`로 되돌린다.

## 요청별 규칙

### GET

- 입력: `url`, `params`, `headers`, `options`, `immediate`
- GET body는 타입과 런타임에서 모두 허용하지 않는다.
- `immediate` 기본값은 `false`다.
- `immediate: true`일 때만 Nuxt `useFetch`로 최초 SSR 요청과 payload 재사용을 수행한다.
- 수동 요청은 반환 객체의 `execute()`로 실행한다.

### Mutation

- 대상: POST, PUT, PATCH, DELETE
- 입력: `url`, `params`, `body`, `headers`, `options`
- 이벤트 기반 `$fetch`를 사용한다.
- DELETE에도 body를 전달할 수 있다.
- 병렬 실행 중에는 진행 중인 요청이 하나 이상 남아 있는 동안 `pending`을 유지한다.

## 내부 구조

- `types.ts`는 GET 및 mutation 입력 타입, 공통 반환 타입, 오류 타입을 정의한다.
- `shared.ts`는 request override 병합, 헤더 병합, 오류 정규화, mutation 상태 생성을 담당한다.
- 내부 mutation factory가 HTTP method별 중복 구현을 제거한다.
- 각 공개 composable은 method 제약과 Nuxt 데이터 패칭 방식을 선택하는 얇은 진입점으로 남긴다.
- SSR 내부 API 호출은 같은 출처 요청의 헤더 전달을 고려할 수 있는 fetch client를 사용한다.

## Pinia 기본 구조

`app/stores/app.store.ts`에 setup store 템플릿을 둔다.

- 공통 UI 및 앱 상태만 둔다.
- 상태를 초기화하는 `reset()`을 제공한다.
- API query 결과나 요청 진행 상태는 저장하지 않는다.
- 실제 도메인이 생기면 `auth.store.ts`, `document.store.ts`처럼 분리한다.

## 검증

- GET 수동 실행과 `immediate: true` 실행을 각각 테스트한다.
- mutation의 params/body, 다건 DELETE body, header 병합, reset, 오류 정규화를 테스트한다.
- 병렬 mutation의 pending 상태를 테스트한다.
- Pinia store의 초기 상태와 reset을 테스트한다.
- 변경 파일 lint, Nuxt typecheck, 전체 test, build를 실행한다.
