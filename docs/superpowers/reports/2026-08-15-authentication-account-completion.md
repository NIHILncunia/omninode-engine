# Omninode 단계 1 인증·계정 완료 리포트

## 대상 문서

- 설계: `docs/superpowers/specs/2026-08-15-authentication-account-design.md`
- 계획: `docs/superpowers/plans/2026-08-15-authentication-account.md`
- 관련 경로 정정 계획: `docs/superpowers/plans/2026-08-15-admins-route-normalization.md`
- 진행 대장: `TODO.md` 단계 1

## 완료 범위

- HttpOnly 쿠키 기반 `/api/auth/signin`, refresh, signout, me, password API를 구현했다.
- access·refresh 토큰을 모두 쿠키로 운용하고 refresh 및 비밀번호 변경 시 두 토큰을 함께 회전하도록 구현했다.
- Argon2id 비밀번호 해시, JWT 검증, refresh token 해시·만료·폐기, 비활성·삭제 계정 거부를 구현했다.
- `/signin`, `/account`, `/account/password-change` UI와 세션 복구·로그아웃·임시 비밀번호 변경 강제 흐름을 구현했다.
- 관리자 계정 관리의 정식 경로를 `/admins` 계열로 정규화했다.

## 완료 근거

- 완료 커밋: `97931cb` — `2026 0815 feat: 인증 기반 추가`
- 경로 정정 커밋: `9be6752` — `2026 0815 fix: 인증 화면 컴포넌트 연결 정정`
- UI 간격 조정 커밋: `d700fc4`, `9c82f26`, `9c123b1`
- TODO 단계 1의 완료 기준과 세부 항목을 완료 상태로 갱신했다.

## 검증 결과

- 2026-08-15 전체 테스트: 18개 파일, 74개 테스트 통과.
- `pnpm exec vue-tsc --noEmit` 통과.
- `pnpm build` 통과.
- 단계 1 변경 파일 대상 린트 통과.
- 전체 `pnpm lint`는 단계 1과 무관한 기존 24개 오류(`Home.vue`, query composable·테스트 형식 오류)로 실패했으며, 완료 판정과 분리해 TODO에 기록했다.

## 알려진 제한과 후속 시작점

- 토큰은 응답 본문이나 Pinia에 저장하지 않고 쿠키로만 사용한다.
- 실제 원격 PostgreSQL 연결과 마이그레이션 적용은 이 완료 범위에 포함하지 않는다.
- 관리자 역할·프로젝트별 18개 권한 판정은 단계 2에서 구현한다.
- 다음 단계: 단계 2 관리자·권한.
