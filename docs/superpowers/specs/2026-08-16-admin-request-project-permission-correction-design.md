# Omninode 승인형 어드민 요청과 프로젝트별 권한 정정 설계

## 목적

공개 어드민 권한 요청을 SUPER_ADMIN의 승인으로 전환하고, 승인된 관리자만 프로젝트를 생성·관리하게 한다. 권한은 전역 역할 기본값이 아니라 프로젝트별 18개 `admin_permissions` 행으로 판정한다.

## 범위와 완료 기준

- 이메일 계정과 닉네임으로 공개 권한 요청을 제출하고, SUPER_ADMIN이 목록·상세에서 승인 또는 거절할 수 있다.
- 승인 트랜잭션이 ADMIN 계정과 임시 비밀번호 변경 요구 상태를 생성한다.
- 프로젝트 생성 트랜잭션이 생성 관리자에게 해당 프로젝트의 18개 권한 행을 모두 `Y`로 만든다.
- 프로젝트 관리자 팝업이 승인된 기존 관리자만 선택하고, 18개 권한을 설정해 배정·수정·해제한다.
- 기존 역할 기본 권한, 전역 권한 override, 전역 권한 편집 화면·API를 제거한다.
- TODO·설계·계획·완료 리포트가 실제 구현·검증 결과와 일치한다.

## 계정과 요청 모델

- 계정명은 기존 `admins.email`이며 로그인 ID도 이메일을 유지한다.
- 닉네임은 기존 `admins.name`이며 표시명으로 사용한다. `admins`에 계정명·닉네임 컬럼을 새로 만들거나 기존 컬럼을 이름 변경하지 않는다.
- `SUPER_ADMIN`은 시스템 전역 관리자이며 권한 행을 만들지 않는다.
- 일반 관리자는 모두 `ADMIN` 역할 값으로 생성한다. 기존 `SUB_ADMIN` 행은 마이그레이션에서 `ADMIN`으로 정규화하고, `admins.role`은 `SUPER_ADMIN`·`ADMIN` 두 값만 허용한다.
- 프로젝트 소유자·배정 관리자의 차이는 `projects.admin_id`와 `project_admins`의 활성 배정으로만 판정하고 UI에 표시한다. 역할 값은 프로젝트 권한 계산에 사용하지 않는다.

새 `admin_permission_requests` 테이블은 아래 정보를 보관한다.

```text
admin_permission_requests
- id와 공통 상태·감사 컬럼
- email                 varchar(320), 요청 계정명
- name                  varchar(100), 요청 닉네임
- status                PENDING | APPROVED | REJECTED
- reviewed_by_admin_id  -> admins.id, nullable
- reviewed_date         timestamptz, nullable
- rejection_reason      varchar(500), nullable
- credential_delivered_date         timestamptz, nullable
- credential_delivery_failed_date   timestamptz, nullable
```

- 활성·미삭제 `PENDING` 요청은 이메일당 하나만 허용한다.
- 활성 관리자 이메일과 같은 요청은 제출할 수 없다.
- 승인·거절은 `PENDING` 상태에서 한 번만 가능하며, 승인자와 처리 시각을 기록한다.
- 거절 사유는 선택 입력이며 요청자 이메일이나 닉네임을 응답에 불필요하게 노출하지 않는다.

## 승인과 최초 로그인

1. 비인증 요청자가 이메일·닉네임을 제출한다.
2. SUPER_ADMIN이 요청을 조회하고 승인 또는 거절한다.
3. 승인 시 서버가 8자 이상 임시 비밀번호를 생성·해시하고 `passwordChangeRequiredYn = 'Y'`인 ADMIN 계정을 만든다.
4. 기존 삭제 계정의 같은 이메일은 승인으로 복구하지 않는다. 계정 복구·재활성화는 SUPER_ADMIN의 관리자 관리 흐름으로 분리한다.
5. 승인 완료 뒤 임시 비밀번호를 요청 이메일로 전송한다. 성공하면 `credentialDeliveredDate`를, 실패하면 `credentialDeliveryFailedDate`를 기록한다.
6. SUPER_ADMIN은 실패한 승인 요청에서 새 임시 비밀번호를 발급·해시·전송하는 재발송을 실행할 수 있다. 재발송은 기존 비밀번호를 조회하지 않고 새 비밀번호로 교체한다.

비밀번호 원문은 DB·API 응답·로그에 남기지 않는다. SMTP 발송은 `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` 서버 환경 변수로 구성한다. 필수 SMTP 설정이 없으면 승인·재발송 API는 계정을 변경하지 않고 명시적 서버 오류로 거부한다. 서비스·API 테스트에는 가짜 전달자를 주입한다.

## 프로젝트별 권한 모델

권한 마스터는 기존 18개 고정 코드다.

```text
project.create / project.update / project.delete
world.create / world.update / world.delete
document.create / document.update / document.delete
category.create / category.update / category.delete
template.create / template.update / template.delete
project_sub_admin.invite / project_sub_admin.update / project_sub_admin.expel
```

`admin_permissions`에 `project_id`를 추가하고 아래 고유·조회 계약으로 바꾼다.

```text
UNIQUE(project_id, admin_id, permission_id)
INDEX(project_id, admin_id, use_yn, del_yn)
```

- 권한 요청과 승인 시에는 프로젝트가 없으므로 `admin_permissions` 행을 만들지 않는다.
- 승인된 ADMIN은 프로젝트 생성 요청을 할 수 있다.
- 프로젝트 생성 서비스는 프로젝트 행을 먼저 만들고 같은 DB 트랜잭션에서 생성 관리자에게 18개 권한 행을 전부 `Y`로 만든다.
- 프로젝트 소유자도 다른 관리자와 동일하게 해당 18개 행으로 권한을 판정한다. 소유자 암묵 허용 규칙은 두지 않는다.
- 프로젝트에 배정되는 기존 관리자는 `project_admins` 배정과 18개 권한 행을 한 트랜잭션으로 생성한다. 팝업에서 선택하지 않은 권한은 `N`으로 저장한다.
- 권한 행은 활성 `project_admins` 배정이 있는 관리자에 대해서만 읽거나 갱신한다. 프로젝트 생성자는 소유자이므로 생성 시 활성 배정도 함께 만든다.
- SUPER_ADMIN은 모든 프로젝트·권한을 자동 허용하고, 권한 행·배정 행·본인 권한 편집 대상이 아니다.

`project.create`만 프로젝트 ID가 없을 때 판정한다. 승인된 활성 ADMIN은 `project.create`를 허용하며, 생성이 완료된 뒤부터 모든 권한은 새 프로젝트 ID를 사용한다.

## API와 UI

### 어드민 권한 요청

```text
POST /api/admin-permission-requests              비인증 요청 제출
GET  /api/admin-permission-requests              SUPER_ADMIN 요청 목록
GET  /api/admin-permission-requests/:requestId   SUPER_ADMIN 요청 상세
POST /api/admin-permission-requests/:requestId/approve
POST /api/admin-permission-requests/:requestId/reject
POST /api/admin-permission-requests/:requestId/resend-initial-password
```

- 공개 요청 화면은 `/admin-permission-request`다. 이메일과 닉네임만 입력하며 사이드바 없는 레이아웃을 사용한다.
- SUPER_ADMIN의 `/admins` 화면에 요청 목록 진입을 제공한다. 승인·거절은 상세 또는 `ElDialog` 확인 흐름에서 처리한다.

### 프로젝트 관리자

`/projects/:projectId/admins`는 프로젝트 권한 편집의 유일한 UI다.

- `ElDialog`는 승인된 기존 관리자를 검색·선택하고 6행×C/U/D 권한 행렬을 표시한다.
- 신규 계정 생성이나 공개 요청 우회 초대는 제공하지 않는다.
- 저장은 활성 `project_admins` 배정과 18개 `admin_permissions` 행을 하나의 트랜잭션으로 만든다.
- 수정은 동일 팝업에서 18개 권한과 활성 상태를 갱신하고, 해제는 확인 후 배정·권한 행을 소프트 삭제한다.

전역 `/admins/:adminId/permissions`, `/admin/permissions`와 관련 API는 제거한다. `/admins`는 SUPER_ADMIN의 계정·요청 관리만 제공한다.

## 권한 판정과 오류

1. 인증 관리자가 없으면 `UNAUTHORIZED`다.
2. SUPER_ADMIN이면 허용한다.
3. `project.create`는 활성·삭제되지 않은 ADMIN 계정만 허용한다.
4. 나머지 권한은 프로젝트 존재, 활성 `project_admins` 배정, 활성 `admin_permissions.grantYn = 'Y'` 순서로 확인한다.
5. 목록·검색은 접근 가능 대상만 반환한다.
6. 보이지 않는 프로젝트·배정·하위 데이터는 직접 URL과 API에서 `NOT_FOUND`로 처리한다.
7. 접근 가능한 프로젝트에서 부여되지 않은 동작은 `FORBIDDEN`으로 처리한다.

## 정정과 검증

- `9b0d34f`의 역할 기본 권한과 전역 override 구현은 후속 정정 커밋에서 대체한다. 이력을 재작성하거나 강제 푸시하지 않는다.
- 관리자 라우트 골격 테스트는 실제 렌더링 컴포넌트를 기대하도록 수정한다.
- `AppSidebar` 테스트는 Pinia를 마운트 구성에 넣고 자동 import 컴포넌트를 stub 처리한다.
- 단계 2 권한·요청·프로젝트 관리자 서비스/API/UI 테스트를 작성한다.
- 단계 2에서 발생한 신규 린트 오류를 모두 해소하고, 전체 테스트·린트·타입 검사·빌드를 새로 실행한다.
- 단계 0·1 완료 리포트를 추적하고, 정정 완료 후 단계 2 완료 리포트를 작성한다.
