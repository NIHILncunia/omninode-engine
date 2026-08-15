# Omninode 인증·계정 설계

## 목적

관리자 이메일 로그인을 제공하고, access·refresh 토큰을 HttpOnly 쿠키로 운용하며, 임시 비밀번호 변경 전 보호 영역 접근을 차단한다.

## 범위

- `POST /api/auth/signin`, `POST /api/auth/refresh`, `POST /api/auth/signout`, `GET /api/auth/me`, `POST /api/auth/password`
- `/signin`, `/account`, `/account/password-change`의 API 연동 UI
- access token 검증, refresh token 회전·폐기, 비밀번호 변경

역할·프로젝트 범위 기반 권한 체크 함수는 단계 2 관리자·권한에서 실제 관리 기능의 호출 지점과 함께 설계한다. 단계 1의 `GET /api/auth/me`은 이후 권한 계층이 사용할 관리자 ID와 역할을 반환한다.

## 토큰과 쿠키

| 구분 | 저장 방식 | 유효 기간 | 쿠키 범위 |
| --- | --- | --- | --- |
| access token | JWT, HttpOnly 쿠키 | 15분 | `Path=/` |
| refresh token | 무작위 원문은 HttpOnly 쿠키, SHA-256 해시는 DB | 14일 | `Path=/api/auth` |

- 쿠키 이름은 `omninode_access`, `omninode_refresh`다.
- 두 쿠키는 `HttpOnly`, `SameSite=Lax`를 사용하며 운영 환경에서는 `Secure`를 설정한다.
- JWT 서명 키는 `JWT_ACCESS_SECRET` 환경 변수로 관리한다. refresh token은 무작위 원문을 SHA-256 해시로만 DB에 저장하므로 별도 JWT 서명 키를 사용하지 않는다.
- 토큰 원문은 표준 API 응답 `data`에 포함하지 않는다.
- refresh 요청은 유효한 기존 refresh token을 폐기하고 access·refresh token을 함께 새로 발급한다.
- 로그아웃과 비밀번호 변경은 해당 관리자의 활성 refresh token을 폐기하고 쿠키를 만료한다.

## 비밀번호

- 새 비밀번호는 8자 이상이어야 한다.
- 문자 조합 조건은 두지 않는다.
- 비밀번호는 Argon2id 해시로만 저장·검증한다.
- 비밀번호 변경 성공 시 `passwordChangeRequiredYn`을 `N`으로 바꾼다.

## API 계약

모든 성공·오류 본문은 `CreateResponse`의 `error`, `data`, `code`, `message` 형식을 사용한다.

| API | 인증 | 성공 데이터 | 핵심 처리 |
| --- | --- | --- | --- |
| `POST /api/auth/signin` | 불필요 | 관리자 ID, 이메일, 이름, 역할, 비밀번호 변경 필요 여부 | 계정·비밀번호·활성 상태 검증 후 두 쿠키 발급 |
| `POST /api/auth/refresh` | refresh 쿠키 | 관리자 ID, 이메일, 이름, 역할, 비밀번호 변경 필요 여부 | refresh 검증·폐기 후 두 쿠키 회전 |
| `POST /api/auth/signout` | refresh 쿠키 선택 | `null` | refresh 폐기 후 두 쿠키 만료 |
| `GET /api/auth/me` | access 쿠키 | 관리자 ID, 이메일, 이름, 역할, 비밀번호 변경 필요 여부 | access 검증 |
| `POST /api/auth/password` | access 쿠키 | 관리자 ID, 이메일, 이름, 역할, 비밀번호 변경 필요 여부 | 현재 비밀번호 검증, 새 비밀번호 저장, 토큰 재발급 |

- 존재하지 않는 이메일, 잘못된 비밀번호, 비활성·삭제 계정은 모두 `UNAUTHORIZED`로 처리한다.
- access token이 없거나 유효하지 않으면 `UNAUTHORIZED`를 반환한다.
- refresh token의 해시, 만료일, 폐기 여부를 확인한다.

## 화면·상태 흐름

1. `/signin`은 이메일·비밀번호를 제출하고 성공 응답의 관리자 정보로 auth store를 갱신한다.
2. `passwordChangeRequired`가 참이면 `/account/password-change`로 이동한다.
3. 앱 초기화 시 `GET /api/auth/me`으로 auth store를 복구한다. 실패하면 unauthenticated 상태로 전환한다.
4. `/account/password-change`는 성공 후 새 access·refresh 쿠키를 사용해 `passwordChangeRequired`를 해제한다.
5. `/account`는 현재 관리자 정보를 표시하고 로그아웃을 제공한다.
6. `/signin`과 `/account/password-change`는 사이드바를 제외한 `auth` 레이아웃을 사용한다. `/account`는 기존 기본 레이아웃을 유지한다.

## 검증 기준

- 로그인, refresh 회전, 로그아웃, 내 정보, 비밀번호 변경의 정상 흐름을 API·서비스 테스트로 검증한다.
- 인증 실패, 비활성·삭제 계정, 만료·폐기 refresh token, 임시 비밀번호 변경 전 보호 경로를 검증한다.
- UI는 loading·empty·error 상태와 비밀번호 변경 강제 이동을 처리한다.
- 역할·프로젝트 권한 판단은 이 단계의 범위에 포함하지 않는다.
