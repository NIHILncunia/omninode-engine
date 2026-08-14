# 관리자 감사·권한 스키마 설계

## 목적

모든 데이터 변경 주체를 추적하고, 역할의 기본 권한을 유지하면서 관리자별 생성·수정·삭제 권한을 `Y` 또는 `N`으로 조정한다.

## 공통 감사 컬럼

기존 18개 테이블의 공통 컬럼에 아래 식별자 컬럼을 추가한다. TypeScript 속성명과 물리 컬럼명은 각각 camelCase와 snake_case를 사용한다.

| 속성 | 물리 컬럼 | 의미 | NULL |
| --- | --- | --- | --- |
| `createId` | `create_id` | 생성 관리자 ID | 최초 SUPER_ADMIN 시드에서만 허용 |
| `updateId` | `update_id` | 마지막 수정 관리자 ID | 허용 |
| `deleteId` | `delete_id` | 소프트 삭제 관리자 ID | 허용 |

세 컬럼은 `admins.id`를 참조하며 `ON DELETE NO ACTION`을 사용한다. 초기 SUPER_ADMIN은 행 생성 주체가 없으므로 `createId`를 NULL로 둔다. API 저장 계층은 일반 생성에서 `createId`를, 수정에서 `updateId`를, 소프트 삭제에서 `deleteId`를 반드시 설정한다.

## admins 변경

- `createdByAdminId`와 `created_by_admin_id`를 제거하고 공통 `createId`로 대체한다.
- `lastLoginDate`와 `last_login_date`를 `lastSignInDate`와 `last_sign_in_date`로 변경한다.
- `passwordChangeRequiredDate`와 `password_change_required_date`를 nullable 날짜·시각 컬럼으로 추가한다. 임시 비밀번호를 발급할 때 설정하고, 비밀번호 변경 성공 시 NULL로 비운다.
- 기존 역할 `SUPER_ADMIN`, `ADMIN`, `SUB_ADMIN`과 `passwordChangeRequiredYn`은 유지한다.

## 세부 권한

권한은 `admins`의 고정 컬럼으로 만들지 않는다. 권한 코드를 확장 가능한 마스터로 두고, 관리자별 설정을 `adminPermissions`에 `grantYn`으로 저장한다.

### permissions

| 컬럼 | 의미 |
| --- | --- |
| `id` | 권한 ID |
| `code` | 전역 고유 권한 코드 |
| `name` | 관리 화면용 표시명 |
| 공통 감사 컬럼 | 생성·수정·삭제 주체 및 시각, 활성·삭제 상태 |

초기 권한 코드는 다음 18개다.

```text
project.create / project.update / project.delete
world.create / world.update / world.delete
document.create / document.update / document.delete
category.create / category.update / category.delete
template.create / template.update / template.delete
project_sub_admin.invite / project_sub_admin.update / project_sub_admin.expel
```

### adminPermissions

| 컬럼 | 의미 |
| --- | --- |
| `id` | 관리자 권한 행 ID |
| `adminId` | 대상 관리자 |
| `permissionId` | 권한 마스터 |
| `grantYn` | 최종 세부 권한 설정, `Y` 또는 `N` |
| 공통 감사 컬럼 | 생성·수정·삭제 주체 및 시각, 활성·삭제 상태 |

`(adminId, permissionId)`는 소프트 삭제 행도 포함해 고유하다. 하나의 활성 행만 유지하며 설정을 바꿀 때 `grantYn`을 수정한다.

## 권한 판정

1. 인증된 관리자의 역할 기본 권한을 확인한다.
2. `adminPermissions`의 활성 행이 있으면 해당 `grantYn`을 역할 기본값보다 우선 적용한다.
3. 프로젝트 범위 API는 프로젝트 소유자 또는 `projectAdmins`의 활성 배정 여부를 함께 확인한다.
4. 권한 없는 프로젝트와 하위 데이터는 목록·검색·직접 URL·API에서 존재를 노출하지 않는다.

역할 기본 범위는 기존 명세를 유지한다. `SUPER_ADMIN`은 전체 권한, `ADMIN`은 소유 프로젝트 범위 권한, `SUB_ADMIN`은 배정 프로젝트의 문서·카테고리·템플릿 범위 권한만 가진다. 세부 권한 행은 역할 기본 범위 안에서만 허용·차단할 수 있다.

`project_sub_admin.invite`는 `projectAdmins` 행 생성, `project_sub_admin.update`는 기존 배정 행의 `useYn` 변경, `project_sub_admin.expel`은 배정 행의 소프트 삭제다.

## 적용과 검증

- SQLite와 PostgreSQL Drizzle 스키마에 동일한 계약을 선언한다.
- 스키마 구조 테스트는 공통 감사 컬럼, 관리자 컬럼 변경, `permissions`·`adminPermissions` export, YN CHECK, 외래키와 고유 인덱스를 검증한다.
- 기존 개발 SQLite DB는 로컬 개발 전용이므로 새 스키마로 재생성해 이전 컬럼을 제거한다.
- 구현 뒤 대상 테스트, Drizzle `db:dev:push`, 타입 검사, 빌드와 SQLite 메타데이터 검사를 새로 실행한다.
