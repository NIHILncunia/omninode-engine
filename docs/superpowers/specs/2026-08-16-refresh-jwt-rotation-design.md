# Refresh JWT 전환 설계

## 목적

기존 난수 refresh token을 별도 secret으로 서명한 JWT로 전환한다. access와 refresh의 수명·서명 키·용도를 분리하고, refresh token 회전과 DB 폐기 이력은 유지한다.

## 확정 정책

- access token은 `JWT_ACCESS_SECRET`으로 서명한 JWT이며 만료는 1시간이다.
- refresh token은 `JWT_REFRESH_SECRET`으로 서명한 JWT이며 만료는 7일이다.
- access secret은 영문 대소문자·숫자로만 구성한 120자 난수다.
- refresh secret은 영문 대소문자·숫자로만 구성한 160자 난수다.
- 개발과 운영은 서로 다른 access·refresh secret 쌍을 사용한다.
- refresh token은 JWT여도 원문을 DB에 저장하지 않고 SHA-256 해시만 `admin_refresh_tokens.token_hash`에 저장한다.

## 토큰 계약

access JWT는 기존 `adminId`, `email`, `role`, `passwordChangeRequired` payload를 유지한다. issuer는 `omninode`, 만료는 1시간이다.

refresh JWT는 다음을 포함한다.

- subject: 관리자 ID
- issuer: `omninode`
- `tokenUse`: `refresh`
- `jti`: 매 발급마다 새로 만드는 난수 식별자
- 만료: 7일

refresh API는 refresh JWT의 서명·issuer·`tokenUse`·만료를 검증한 뒤, 원문 SHA-256 해시로 활성 DB 행을 찾는다. JWT subject와 DB 행의 `admin_id`가 다르면 거부한다. 검증에 성공하면 기존 행을 폐기하고 새 refresh JWT와 access JWT를 함께 발급한다.

## 환경 설정

`nuxt.config.ts` runtime config에 `jwtRefreshSecret`을 추가한다. `.env.development`, `.env.production`에는 실제 난수 값을, 두 example 파일에는 자리표시자를 각각 추가한다.

환경 변수 점검은 인증에 필요한 `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`과 관리자 권한 승인 메일에 필요한 SMTP 6개 항목을 구분해 보고한다. SMTP가 없으면 로그인·refresh는 가능하지만 초기 비밀번호 이메일 발송은 실패한다.

## 검증

- access JWT가 1시간 만료와 access secret 서명을 사용하는지 검증한다.
- refresh JWT가 refresh secret·7일 만료·`tokenUse='refresh'`를 요구하는지 검증한다.
- access JWT 또는 다른 refresh secret으로 서명한 token을 refresh API가 거부하는지 검증한다.
- refresh JWT subject와 DB token 행의 관리자가 다르면 거부하는지 검증한다.
- 개발 환경에서 로그인 → refresh → `GET /api/auth/me`을 실제 쿠키로 검증한다.
