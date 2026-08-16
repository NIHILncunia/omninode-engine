# 인증 세션 수명 주기 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 유효한 persistent 인증 쿠키로 브라우저 재시작과 SSR 새로고침 뒤에도 세션을 복원하고, access 만료 시 refresh 회전으로 로그인 상태를 유지한다.

**Architecture:** 인증 쿠키의 `Max-Age`를 JWT 만료 시간과 같은 값으로 통일한다. Nitro 서버 미들웨어가 SSR 요청에서 access 검증 또는 refresh 회전을 수행해 outer 페이지 응답에 cookie를 설정하고 event context에 관리자 DTO를 전달한다. Pinia auth store는 클라이언트에서만 `me → refresh → me` 순서를 수행하며, 두 인증 토큰이 모두 거부된 경우에만 비인증 상태로 전이한다.

**Tech Stack:** Nuxt 4, Nitro/H3 cookies, Pinia, Vue Query 기반 앱 구조, Vitest, TypeScript

## Global Constraints

- access JWT와 access cookie `Max-Age`는 정확히 3600초다.
- refresh JWT와 refresh cookie `Max-Age`는 정확히 604800초다.
- 두 쿠키는 `HttpOnly`, `SameSite=Lax`, 명시적 `Max-Age`를 유지한다.
- 운영 환경의 `Secure` 쿠키는 HTTPS 연결을 전제한다.
- SSR 세션 확인은 Nitro event와 auth service를 직접 사용해 outer response cookie를 보존한다.
- `me`와 `refresh`가 모두 401일 때만 store를 unauthenticated로 전이한다.
- 네트워크·5xx 오류는 기존 인증 정보를 지우지 않고 호출자에게 전파한다.
- 토큰 원문·JWT secret은 store, 응답 본문, 테스트 출력에 포함하지 않는다.

---

### Task 1: JWT와 persistent cookie 수명 동기화

**Files:**
- Modify: `server/utils/auth-cookie.ts:5-6`
- Modify: `test/auth-api.test.ts:57-73`

**Interfaces:**
- Consumes: `setAuthCookies(event, accessToken, refreshToken): void`
- Produces: access cookie `maxAge: 3600`, refresh cookie `maxAge: 604800`

- [x] **Step 1: 실패하는 cookie 수명 계약 테스트를 작성한다.**

`test/auth-api.test.ts`의 signin cookie 기대값을 다음처럼 바꾼다.

```ts
maxAge: 3600,
```

refresh cookie 기대값을 다음처럼 바꾼다.

```ts
maxAge: 604800,
```

- [x] **Step 2: 계약 테스트가 현재 값과 불일치하여 실패하는지 확인한다.**

Run: `pnpm test -- test/auth-api.test.ts`

Expected: `maxAge`가 각각 `900`, `1209600`으로 수신되어 실패.

- [x] **Step 3: cookie 상수를 JWT 정책과 같은 초 단위로 수정한다.**

`server/utils/auth-cookie.ts`에서 다음 값을 사용한다.

```ts
const accessMaxAge = 60 * 60;
const refreshMaxAge = 7 * 24 * 60 * 60;
```

- [x] **Step 4: cookie 계약 테스트를 다시 실행한다.**

Run: `pnpm test -- test/auth-api.test.ts`

Expected: PASS.

### Task 2: 클라이언트 access 자동 재발급 세션 복원

**Files:**
- Modify: `app/stores/auth.store.ts:1-81`
- Modify: `test/auth-store.test.ts:1-118`

**Interfaces:**
- Consumes: `useRequestFetch(): typeof $fetch`, `AuthResponse`, H3/Nitro 401 fetch 오류
- Produces: `onRestoreSession(): Promise<boolean>`; 성공 시 `true`, access·refresh 모두 401일 때 `false`, 그 밖의 통신 오류는 reject

- [x] **Step 1: SSR 요청 fetch와 refresh 재시도에 대한 실패 테스트를 작성한다.**

`test/auth-store.test.ts`에서 `useRequestFetch`를 `requestFetchApi`로 stub하고, 다음 두 사례를 추가한다.

```ts
it('access 만료 뒤 refresh와 me 재시도를 수행한다', async () => {
  requestFetchApi
    .mockRejectedValueOnce({ statusCode: 401, })
    .mockResolvedValueOnce({ error: false, data: { admin, }, })
    .mockResolvedValueOnce({ error: false, data: { admin, }, });

  await expect(auth.onRestoreSession()).resolves.toBe(true);
  expect(requestFetchApi).toHaveBeenNthCalledWith(2, '/api/auth/refresh', {
    method: 'POST', credentials: 'include',
  });
  expect(requestFetchApi).toHaveBeenNthCalledWith(3, '/api/auth/me', {
    credentials: 'include',
  });
});
```

```ts
it('401 이외의 세션 확인 오류에서는 인증 상태를 지우지 않는다', async () => {
  auth.onSetAuthenticated(false, admin);
  requestFetchApi.mockRejectedValueOnce({ statusCode: 500, });

  await expect(auth.onRestoreSession()).rejects.toMatchObject({ statusCode: 500, });
  expect(auth.status).toBe('authenticated');
  expect(auth.admin).toEqual(admin);
});
```

또한 `me` 401 뒤 refresh 401이 `false`와 unauthenticated 상태를 반환하는 사례를 추가한다.

- [x] **Step 2: 새 store 테스트가 현재 구현에서 실패하는지 확인한다.**

Run: `pnpm test -- test/auth-store.test.ts`

Expected: `$fetch` 사용, refresh 미호출, 5xx에서 상태 초기화 때문에 실패.

- [x] **Step 3: 재사용 가능한 요청과 401 판별을 구현한다.**

`auth.store.ts`에 status code를 `number | undefined`로 안전하게 좁히는 private helper를 추가한다.

```ts
function isUnauthorizedError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'statusCode' in error
    && error.statusCode === 401;
}
```

`onRestoreSession` 안에서 `const requestFetch = useRequestFetch()`를 얻고 `me`를 호출한다. 첫 `me`의 401에서만 아래 요청을 한 번 호출하고, 성공하면 다시 `me`를 호출한다.

```ts
await requestFetch<AuthResponse>('/api/auth/refresh', {
  method: 'POST',
  credentials: 'include',
});
```

refresh의 401 또는 재시도 `me`의 401에서만 `onSetUnauthenticated()`와 `false`를 반환한다. 다른 오류는 catch하지 않고 다시 throw하여 기존 `admin`과 `status`를 보존한다.

- [x] **Step 4: store 단위 테스트를 통과시킨다.**

Run: `pnpm test -- test/auth-store.test.ts`

Expected: SSR fetch 사용, refresh 한 번, refresh 실패 비인증, 5xx 상태 보존 사례 모두 PASS.

### Task 3: SSR event 세션 복원과 cookie 회전

**Files:**
- Create: `server/utils/auth-session.ts`
- Create: `server/middleware/00.auth-session.ts`
- Modify: `app/middleware/auth.global.ts`
- Create: `test/auth-session.test.ts`

**Interfaces:**
- Consumes: `H3Event`, `getAuthService()`, `setAuthCookies(event, accessToken, refreshToken)`
- Produces: `restoreRequestAdmin(event): Promise<AuthenticatedAdmin | null>`와 `event.context.authenticatedAdmin`

- [x] **Step 1: 실패하는 SSR refresh 회전 단위 테스트를 작성한다.**

access 검증이 401이고 refresh가 성공하면 `restoreRequestAdmin`이 session admin을 반환하며 `setAuthCookies`가 같은 outer event로 호출되는 사례를 작성한다. access와 refresh가 모두 401이면 `null`을 반환하는 사례도 작성한다.

- [x] **Step 2: 단위 테스트가 미구현 모듈 때문에 실패하는지 확인한다.**

Run: `pnpm test -- test/auth-session.test.ts`

Expected: `server/utils/auth-session` 모듈을 찾지 못해 FAIL.

- [x] **Step 3: SSR 세션 복원과 페이지 보호 미들웨어를 구현한다.**

`restoreRequestAdmin`은 access 검증 성공 시 admin을 반환한다. access의 401에서만 refresh cookie로 `getAuthService().refresh()`를 호출하고, 성공 session의 두 토큰을 `setAuthCookies`로 outer event에 설정한 뒤 session admin을 반환한다. refresh 401은 `null`을 반환하고 그 밖의 오류는 throw한다.

`server/middleware/00.auth-session.ts`은 `/api`, `/_nuxt`, 확장자 정적 경로, 공개 경로를 제외한 페이지 요청을 보호한다. 복원된 admin은 `event.context.authenticatedAdmin`에 보관하고, 없으면 `/signin`으로 redirect한다.

`auth.global.ts`은 서버에서 context admin으로 store를 설정하고, 클라이언트에서만 기존 `onRestoreSession()`을 호출한다.

- [x] **Step 4: SSR 세션 단위 테스트를 통과시킨다.**

Run: `pnpm test -- test/auth-session.test.ts`

Expected: access 성공, refresh 회전, 두 토큰 거부, 비401 오류 전파 사례가 PASS.

### Task 4: 실제 SSR cookie 왕복 검증과 진행 기록

**Files:**
- Modify: `TODO.md` (검증 완료 뒤 인증 세션 수명 주기 항목만 반영)

**Interfaces:**
- Consumes: 개발 서버 `http://localhost:3000`, signin이 발급한 `Set-Cookie`
- Produces: SSR `/admin` 요청의 인증 복원과 refresh 회전 `Set-Cookie` 전파 근거

- [x] **Step 1: 개발 서버에서 signin cookie를 받아 cookie jar를 구성한다.**

`POST /api/auth/signin` 응답의 cookie 이름과 `Max-Age`만 점검하고 토큰 원문은 출력하지 않는다.

- [x] **Step 2: access와 refresh cookie가 있는 `/admin` SSR 요청을 확인한다.**

cookie jar를 새 요청에 전달하여 상태가 200이고 `/signin` location header가 없는지 확인한다. 이는 브라우저 재시작 뒤 persistent cookie 재전송을 모사한다.

- [x] **Step 3: 유효 refresh와 무효 access로 SSR 자동 회전을 확인한다.**

access 값만 무효 문자열로 치환해 `/admin`을 요청한다. 상태 200, `/signin` 미리다이렉트, 응답에 access·refresh 이름의 `Set-Cookie` 두 개가 존재하는지를 확인한다. 이 검증이 실패하면 refresh cookie를 outer SSR 응답에 전파하는 서버 이벤트 수정으로 원인을 좁힌다.

- [x] **Step 4: 영향 범위 검증을 실행한다.**

Run: `pnpm test && pnpm lint && pnpm exec vue-tsc --noEmit && pnpm build`

Expected: 인증 변경으로 인한 실패 없음. 기존 무관한 실패가 있으면 명령과 원인을 분리 기록.

- [x] **Step 5: `TODO.md`에 완료 근거를 반영한다.**

테스트·통합 검증이 모두 성공한 경우에만 인증 단계의 세션 수명 주기 완료 항목을 체크하고, 남아 있는 단계 2.5 작업은 완료로 표시하지 않는다.

- [x] **Step 6: 커밋 여부를 확인한다.**

현재 작업은 기존 단계 2.5의 일부이므로, 단계 전체 완료 검증 전에는 커밋하지 않는다. 단계 2.5가 완료되는 시점에만 프로젝트 형식의 커밋 메시지로 함께 커밋한다.
