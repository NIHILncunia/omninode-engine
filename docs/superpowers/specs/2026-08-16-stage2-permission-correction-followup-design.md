# Omninode 단계 2 권한 정정 후속 설계

## 목적

프로젝트 관리자 배정 해제 뒤에도 권한이 남는 결함을 제거하고, 삭제 ADMIN 재승인과 항상 최신인 클라이언트 상태를 확정한다. 이 정정이 완료된 뒤에만 단계 3 프로젝트 CRUD를 시작한다.

## 배정과 권한 행 수명

- 배정 해제는 하나의 DB transaction에서 `project_admins` 1행과 해당 `(project_id, admin_id)`의 18개 `admin_permissions` 행을 함께 `useYn='N'`, `delYn='Y'`로 소프트 삭제한다.
- 재배정은 같은 transaction에서 배정 행과 18개 권한 행을 복구하고, 요청한 18개 `grantYn`을 모두 최신값으로 갱신한다.
- 권한 판정은 SUPER_ADMIN 우회 뒤 활성 ADMIN, 활성 `project_admins` 배정, 활성 `admin_permissions.grantYn='Y'`를 모두 요구한다.

## 권한 마스터와 프로젝트 생성 전제

- `permissions`의 18개 고정 마스터는 데이터 주입하는 SUPER_ADMIN을 감사 주체로 사용해 seed한다.
- 프로젝트 생성 API와 관리자 배정 API가 요청 중 전역 권한 마스터를 자동 생성하지 않는다.
- 단계 3 프로젝트 생성 transaction은 마스터가 정확히 18개인 것을 검증한 뒤 프로젝트, 생성자 배정, 18개 `Y` 권한 행을 함께 저장한다.

## 삭제 ADMIN 재승인

- 삭제된 ADMIN 이메일은 공개 권한 요청을 다시 제출할 수 있다.
- SUPER_ADMIN 승인 transaction은 삭제된 `admins` 행을 복구하고, 요청 닉네임, 새 임시 비밀번호 hash, 비밀번호 변경 요구 상태를 갱신한 뒤 요청을 `APPROVED`로 바꾼다.
- transaction 커밋 뒤 SMTP 메일을 보낸다. 전송 실패는 계정·승인 상태를 되돌리지 않고 전달 실패 시각만 기록한다.

## 최신 클라이언트 상태

- 목록·상세 GET은 Vue Query로 조회하고 성공 응답을 도메인 `<domain>.store.ts`에 저장한다.
- 생성·수정·삭제 mutation은 낙관 갱신을 하지 않는다. 성공 후 관련 query를 invalidate하고 refetch한 서버 응답으로 store를 교체한다.
- 관리자 계정 화면은 `administrator.store.ts`를 사용한다.

## 문서와 검증

- 이전 단계 2 완료 표기와 완료 리포트는 이 후속 정정이 검증될 때까지 완료가 아닌 상태로 처리한다.
- `permission.data.ts`의 역할 기본 권한 함수와 서브 어드민 기본값은 제거한다.
- TODO의 오래된 현재 상태와 삭제된 설계 초안 참조를 정정한다.
- 후속 정정은 서비스·repository 단위 테스트, 전체 테스트·린트·타입 검사·빌드로 검증한다.
