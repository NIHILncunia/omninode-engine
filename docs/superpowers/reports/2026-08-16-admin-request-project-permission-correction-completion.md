# Omninode 단계 2 관리자 요청·프로젝트 권한 정정 완료 리포트

## 대상 문서

- 초기 설계: `docs/superpowers/specs/2026-08-16-admin-permission-management-design.md` (정정 전 기록)
- 후속 설계: `docs/superpowers/specs/2026-08-16-stage2-permission-correction-followup-design.md`
- 후속 계획: `docs/superpowers/plans/2026-08-16-stage2-permission-correction-followup.md`
- 진행 대장: `TODO.md` 단계 2

## 완료 범위

- 공개 이메일·닉네임 기반 관리자 권한 요청과 SUPER_ADMIN 승인·거절·초기 비밀번호 재발송 흐름을 구현했다.
- 비밀번호 원문은 저장·응답·로그에 넣지 않고, SMTP 메일 발송에만 사용한다. 발송 실패 시 상태를 기록하고 새 임시 비밀번호로 재발송한다.
- `SUB_ADMIN` 역할과 전역 권한 override를 제거하고, `(project_id, admin_id, permission_id)` 기준의 18개 프로젝트 권한 행으로 판정을 전환했다.
- 프로젝트 관리자는 기존 승인 ADMIN만 `ElDialog`에서 선택해 18개 권한을 설정하고 배정·해제한다.
- 활성 프로젝트 배정이 없는 ADMIN은 권한 행의 `Y` 값만으로 인가되지 않으며, 배정 해제 시 배정·18개 권한 행을 함께 소프트 삭제한다. 재배정은 두 종류의 행을 복구·갱신한다.
- 삭제된 ADMIN 이메일은 새 요청을 제출할 수 있고, 승인 시 기존 `admins` 행의 삭제 상태 복구와 요청 승인 전이가 하나의 PostgreSQL transaction으로 수행된다. SMTP 전송은 transaction 커밋 후에만 수행한다.
- 권한 마스터는 활성 SUPER_ADMIN actor가 명시적으로 동기화하는 18개 정의로 유지하며, 역할별 기본 권한 및 `SUB_ADMIN` 잔재는 제거했다.
- 화면 서버 조회는 Vue Query로 수행하고, 결과를 `admin-permission-request.store.ts`, `project-admin.store.ts`, `administrator.store.ts`에 동기화한다. 변경 mutation은 낙관 갱신 없이 쿼리 무효화·재조회한다.

## 완료 근거

- `0107507` — 관리자 권한 요청·SMTP·마이그레이션 기반
- `d5ac259` — 프로젝트별 권한 모델 및 전역 권한 경계 제거
- `30a7ae7` — 공개 요청·검토 화면과 요청 store
- `b2eb926` — 프로젝트 관리자 권한 배정 대화상자와 store
- `99be173` — 전체 린트와 라우트·Pinia 회귀 테스트 정리
- `a99ba1c` — 완료 리포트 운영 규칙과 단계 0·1 리포트 추적
- `7f44477` — 배정·권한 행 동시 소프트 삭제와 활성 배정 인가 조건
- `d3a29f7` — 관리자 권한 요청 목록 repository 반환 정정
- `9c8f0dc` — 삭제 ADMIN 복구와 요청 승인의 단일 transaction
- `ab1dde4` — 명시적 권한 마스터 동기화 서비스와 역할 기본값 제거
- `601d2ef` — 관리자 Vue Query/store 최신 상태 동기화

## 검증 결과

- `pnpm test`: 24개 파일, 88개 테스트 통과
- `pnpm lint`: 통과
- `pnpm exec vue-tsc --noEmit`: 통과
- `pnpm build`: 통과. `Build complete!`와 종료 코드 0을 확인했다. Nuxt 의존성의 `DEP0155` 경고와 Rolldown plugin timing 경고는 발생했으나 실패는 아니었다.
- `git diff --check`: 통과

## 후속 범위

- 단계 3 프로젝트 CRUD 서비스는 생성 transaction 안에서 생성 ADMIN의 `project_admins` 배정과 18개 `Y` 권한 행 생성을 호출한다.
- 단계 3 시작 전제는 현재 구현한 권한 마스터 동기화 서비스를 SUPER_ADMIN 초기 데이터 주입 절차에서 한 번 실행해 18개 마스터 행을 준비하는 것이다.
