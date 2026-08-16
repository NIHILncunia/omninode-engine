# 인증 세션 수명 주기 완결 설계

## 목적

관리자가 로그인한 뒤 새로고침과 브라우저 재시작을 거쳐도 유효한 access 또는 refresh 쿠키로 세션을 복원한다. access 만료는 refresh 회전으로 처리하고, refresh가 만료·폐기되었을 때만 로그인 상태를 해제한다.

## 확정 정책

- access JWT와 access 쿠키의 수명은 모두 1시간이다.
- refresh JWT와 refresh 쿠키의 수명은 모두 7일이다.
- 두 쿠키는 `HttpOnly`, `SameSite=Lax`, 명시적 `Max-Age`를 유지하므로 브라우저 종료 뒤에도 만료 전까지 보존한다.
- 운영 환경의 `Secure` 쿠키는 HTTPS 연결을 전제한다.
- SUPER_ADMIN은 `password_change_required_yn` 값과 무관하게 비밀번호 변경 요구를 받지 않는다.
- 일반 ADMIN만 `password_change_required_yn='Y'`일 때 비밀번호 변경 화면으로 이동한다.

## 세션 복원 흐름

1. SSR 보호 경로는 Nitro 서버 미들웨어가 access cookie로 세션을 복원하고, 성공한 관리자 DTO를 요청 event context에 보관한다.
2. SSR에서 access가 401이면 서버 미들웨어가 auth service의 refresh를 직접 호출해 outer 페이지 응답에 access·refresh cookie를 설정하고 관리자 DTO를 event context에 보관한다.
3. 서버 미들웨어에서 access·refresh가 모두 401이면 보호 경로만 `/signin`으로 리다이렉트한다. 다른 오류는 인증 실패로 위장하지 않고 전파한다.
4. Nuxt 전역 인증 미들웨어는 SSR event context의 관리자 DTO로 store를 초기화한다.
5. 클라이언트 보호 경로 진입 시 auth store가 `GET /api/auth/me`을 호출한다. `me`가 401이면 `POST /api/auth/refresh`를 한 번 호출하고 `me`를 재시도한다.
6. 클라이언트 refresh도 401이면 store를 unauthenticated로 바꾸고 보호 경로만 `/signin`으로 이동한다.
7. 클라이언트 네트워크·서버 5xx 오류는 기존 인증 정보를 제거하지 않고 호출자에게 전파한다.

## 구현 경계

- `server/utils/auth-session`은 SSR 전용 access 검증·refresh 회전·outer response cookie 발급을 담당한다.
- `auth.store`는 클라이언트 세션 복원의 요청 순서와 상태 전이만 담당한다.
- API 토큰 검증·회전·쿠키 발급은 기존 auth service와 `setAuthCookies`를 재사용한다.
- 전역 인증 미들웨어는 SSR event context 또는 클라이언트 store 복원 결과를 사용해 리다이렉트를 판단한다.

## 검증 기준

- access cookie가 있는 SSR 보호 경로 요청은 로그인 화면으로 리다이렉트하지 않는다.
- access 없이 유효 refresh cookie만 가진 세션은 refresh 회전 뒤 인증 상태를 복원한다.
- access·refresh가 모두 없거나 refresh가 무효면 보호 경로가 `/signin`으로 리다이렉트한다.
- 로그인과 refresh 응답의 cookie `Max-Age`가 각각 3600초와 604800초다.
- 브라우저 종료 후에도 `Max-Age`가 남아 있는 쿠키를 재전송할 수 있는 cookie jar 통합 검사를 통과한다.
