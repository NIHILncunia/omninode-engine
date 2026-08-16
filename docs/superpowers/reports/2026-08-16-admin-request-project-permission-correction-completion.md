# Omninode 단계 2 관리자 요청·프로젝트 권한 정정 완료 리포트

## 대상 문서

- 설계: `docs/superpowers/specs/2026-08-16-admin-request-project-permission-correction-design.md`
- 계획: `docs/superpowers/plans/2026-08-16-admin-request-project-permission-correction.md`
- 후속 계획: `docs/superpowers/plans/2026-08-16-project-management-permission-initialization.md`
- 진행 대장: `TODO.md` 단계 2

## 완료 범위

- 공개 이메일·닉네임 기반 관리자 권한 요청과 SUPER_ADMIN 승인·거절·초기 비밀번호 재발송 흐름을 구현했다.
- 비밀번호 원문은 저장·응답·로그에 넣지 않고, SMTP 메일 발송에만 사용한다. 발송 실패 시 상태를 기록하고 새 임시 비밀번호로 재발송한다.
- `SUB_ADMIN` 역할과 전역 권한 override를 제거하고, `(project_id, admin_id, permission_id)` 기준의 18개 프로젝트 권한 행으로 판정을 전환했다.
- 프로젝트 관리자는 기존 승인 ADMIN만 `ElDialog`에서 선택해 18개 권한을 설정하고 배정·해제한다.
- 화면 서버 조회는 Vue Query로 수행하고, 결과를 `admin-permission-request.store.ts` 및 `project-admin.store.ts`에 동기화한다.

## 완료 근거

- `0107507` — 관리자 권한 요청·SMTP·마이그레이션 기반
- `d5ac259` — 프로젝트별 권한 모델 및 전역 권한 경계 제거
- `30a7ae7` — 공개 요청·검토 화면과 요청 store
- `b2eb926` — 프로젝트 관리자 권한 배정 대화상자와 store
- `99be173` — 전체 린트와 라우트·Pinia 회귀 테스트 정리
- `a99ba1c` — 완료 리포트 운영 규칙과 단계 0·1 리포트 추적

## 검증 결과

- `pnpm test`: 21개 파일, 82개 테스트 통과
- `pnpm lint`: 통과
- `pnpm exec vue-tsc --noEmit`: 통과
- `pnpm build`: 통과. Windows 실행 제한으로 백그라운드 로그를 통해 `Build complete!`와 하위 프로세스 종료를 확인했다.
- `git diff --check`: 통과

## 후속 범위

- 단계 3 프로젝트 CRUD 서비스는 생성 트랜잭션 안에서 생성 ADMIN의 `project_admins` 배정과 18개 `Y` 권한 행 생성을 호출한다.
