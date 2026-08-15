# 관리자·권한 관리 설계

## 목적

2단계 관리자·권한 기능은 역할 기본 권한, 관리자별 세부 권한, 프로젝트 배정 범위를 하나의 판정 경계로 통합한다. 관리자 관리 API와 화면은 이 판정 서비스를 사용하며, 권한 없는 리소스의 존재를 목록·검색·직접 URL·API에서 노출하지 않는다.

## 범위

이번 단계에 포함한다.

- 역할별 기본 권한 계산
- 관리자별 권한 조회·수정
- 전역 관리자 목록·생성·상세·수정·소프트 삭제
- 권한 마스터 조회
- 프로젝트별 서브 어드민 초대·재초대·비활성화·배정 해제
- 관리자 관리 화면과 프로젝트 관리자 화면의 API 연동
- 권한 없는 데이터 비노출 및 직접 URL 차단

이번 단계에서는 프로젝트·월드·카테고리·템플릿·문서 자체의 CRUD를 구현하지 않는다. 해당 기능은 각 단계에서 동일한 권한 계산 서비스를 호출한다.

## 권한 모델

### 권한 코드

권한 마스터는 다음 18개 코드를 사용한다.

```text
project.create
project.update
project.delete
world.create
world.update
world.delete
document.create
document.update
document.delete
category.create
category.update
category.delete
template.create
template.update
template.delete
project_sub_admin.invite
project_sub_admin.update
project_sub_admin.expel
```

관리자 화면에서는 권한을 다음 6개 그룹으로 표시한다.

| 그룹 코드 | 표시 그룹 | 포함 권한 |
| --- | --- | --- |
| `project` | 프로젝트 관리 | `project.create`, `project.update`, `project.delete` |
| `world` | 월드 관리 | `world.create`, `world.update`, `world.delete` |
| `document` | 설정 문서 관리 | `document.create`, `document.update`, `document.delete` |
| `category` | 카테고리 관리 | `category.create`, `category.update`, `category.delete` |
| `template` | 템플릿 관리 | `template.create`, `template.update`, `template.delete` |
| `project_sub_admin` | 프로젝트 관리자 관리 | `project_sub_admin.invite`, `project_sub_admin.update`, `project_sub_admin.expel` |

각 권한의 표시명은 다음과 같이 고정한다.

| 권한 코드 | 표시명 |
| --- | --- |
| `project.create` | 프로젝트 생성 |
| `project.update` | 프로젝트 수정 |
| `project.delete` | 프로젝트 삭제 |
| `world.create` | 월드 생성 |
| `world.update` | 월드 수정 |
| `world.delete` | 월드 삭제 |
| `document.create` | 설정 문서 생성 |
| `document.update` | 설정 문서 수정 |
| `document.delete` | 설정 문서 삭제 |
| `category.create` | 카테고리 생성 |
| `category.update` | 카테고리 수정 |
| `category.delete` | 카테고리 삭제 |
| `template.create` | 템플릿 생성 |
| `template.update` | 템플릿 수정 |
| `template.delete` | 템플릿 삭제 |
| `project_sub_admin.invite` | 프로젝트 서브 어드민 초대 |
| `project_sub_admin.update` | 프로젝트 서브 어드민 수정 |
| `project_sub_admin.expel` | 프로젝트 서브 어드민 배정 해제 |

권한 코드는 서버의 상수 타입으로도 관리하지만, 표시명은 `permissions` 테이블에서 조회한다. API는 코드 문자열을 입력받고, 존재하지 않거나 비활성화된 권한 코드는 `BAD_REQUEST`로 거부한다.

### 역할 기본 권한

| 역할 | 기본 허용 범위 |
| --- | --- |
| `SUPER_ADMIN` | 18개 전체 권한, 전체 프로젝트 범위 |
| `ADMIN` | 18개 권한, 자신이 생성한 프로젝트 범위. 전역 관리자·권한 마스터 관리는 제외 |
| `SUB_ADMIN` | `document.*`, `category.*`, `template.*`만 배정된 프로젝트 범위에서 허용 |

권한 코드별 기본값은 다음 행렬로 고정한다. `Y`는 역할 기본 권한 허용, `N`은 기본 권한 거부를 의미한다.

| 권한 그룹 | 권한 코드 | SUPER_ADMIN | ADMIN | SUB_ADMIN |
| --- | --- | :---: | :---: | :---: |
| 프로젝트 관리 | `project.create` | Y | Y | N |
| 프로젝트 관리 | `project.update` | Y | Y | N |
| 프로젝트 관리 | `project.delete` | Y | Y | N |
| 월드 관리 | `world.create` | Y | Y | N |
| 월드 관리 | `world.update` | Y | Y | N |
| 월드 관리 | `world.delete` | Y | Y | N |
| 설정 문서 관리 | `document.create` | Y | Y | Y |
| 설정 문서 관리 | `document.update` | Y | Y | Y |
| 설정 문서 관리 | `document.delete` | Y | Y | Y |
| 카테고리 관리 | `category.create` | Y | Y | Y |
| 카테고리 관리 | `category.update` | Y | Y | Y |
| 카테고리 관리 | `category.delete` | Y | Y | Y |
| 템플릿 관리 | `template.create` | Y | Y | Y |
| 템플릿 관리 | `template.update` | Y | Y | Y |
| 템플릿 관리 | `template.delete` | Y | Y | Y |
| 프로젝트 관리자 관리 | `project_sub_admin.invite` | Y | Y | N |
| 프로젝트 관리자 관리 | `project_sub_admin.update` | Y | Y | N |
| 프로젝트 관리자 관리 | `project_sub_admin.expel` | Y | Y | N |

권한의 `Y` 여부와 별개로 프로젝트 범위를 함께 적용한다.

- `SUPER_ADMIN`: 모든 프로젝트와 전역 관리자·권한 마스터 범위
- `ADMIN`: 자신이 생성한 프로젝트와 그 프로젝트에 배정된 `SUB_ADMIN` 범위
- `SUB_ADMIN`: `projectAdmins`에 활성 배정된 프로젝트의 문서·카테고리·템플릿 범위

따라서 `ADMIN`의 `project.create`는 새 프로젝트 생성에 사용할 수 있지만, `project.update`와 `project.delete`는 자신이 생성한 프로젝트에만 적용한다. `SUB_ADMIN`의 문서·카테고리·템플릿 권한도 배정 프로젝트 밖에서는 허용하지 않는다.

`ADMIN`의 `project_sub_admin.*`은 자신이 생성한 프로젝트의 서브 어드민 관리에 사용한다. `SUB_ADMIN`은 관리자·권한 설정·프로젝트·월드·관계 관리에 접근하지 않는다.

### 최종 권한 판정

```text
인증 관리자 확인
→ 역할 기본 권한 확인
→ adminPermissions 활성 행 확인
→ 활성 grantYn이 있으면 기본값을 Y/N으로 덮어씀
→ 프로젝트 범위가 필요한 경우 소유자 또는 활성 projectAdmins 배정 확인
→ 모든 조건 통과 시 허용
```

`adminPermissions` 행은 `(adminId, permissionId)`가 고유하므로 권한을 변경할 때 기존 행의 `grantYn`과 감사 컬럼을 갱신한다. 행이 없으면 역할 기본값을 사용한다. 역할 기본 범위 밖의 권한을 `Y`로 설정하려는 요청은 허용하지 않는다.

## 서버 경계

### 권한 계산 서비스

`server/services/permission.service.ts`는 다음 책임만 가진다.

- 관리자 역할과 활성 상태 확인
- 권한 코드의 역할 기본값 계산
- 관리자별 `adminPermissions` override 적용
- 프로젝트 소유자·활성 배정 여부 확인
- 권한 부족 시 `FORBIDDEN`, 존재하지 않거나 접근할 수 없는 대상은 `NOT_FOUND`로 변환

서비스의 공개 인터페이스는 다음과 같다.

```ts
type PermissionCode =
  | 'project.create' | 'project.update' | 'project.delete'
  | 'world.create' | 'world.update' | 'world.delete'
  | 'document.create' | 'document.update' | 'document.delete'
  | 'category.create' | 'category.update' | 'category.delete'
  | 'template.create' | 'template.update' | 'template.delete'
  | 'project_sub_admin.invite'
  | 'project_sub_admin.update'
  | 'project_sub_admin.expel';

interface PermissionService {
  can(input: {
    adminId: number;
    permission: PermissionCode;
    projectId?: number;
  }): Promise<boolean>;
  require(input: {
    adminId: number;
    permission: PermissionCode;
    projectId?: number;
  }): Promise<void>;
  assertAssignable(input: {
    actorAdminId: number;
    targetAdminId: number;
    permission: PermissionCode;
    projectId?: number;
  }): Promise<void>;
}
```

### 관리자 API

```text
GET    /api/admins
POST   /api/admins
GET    /api/admins/:adminId
PATCH  /api/admins/:adminId
DELETE /api/admins/:adminId

GET    /api/permissions
GET    /api/admins/:adminId/permissions
PATCH  /api/admins/:adminId/permissions

GET    /api/projects/:projectId/admins
POST   /api/projects/:projectId/admins
PATCH  /api/projects/:projectId/admins/:adminId
DELETE /api/projects/:projectId/admins/:adminId
```

관리자 생성 시 서버가 임시 비밀번호를 생성하고 `passwordChangeRequiredYn = 'Y'`와 `passwordChangeRequiredDate`를 설정한다. 이메일 발송 인프라는 별도 구현 전까지 서비스의 발송 경계를 주입 가능한 인터페이스로 둔다.

관리자 삭제와 프로젝트 관리자 배정 해제는 물리 삭제가 아니라 `delYn = 'Y'`, `deleteDate`, `deleteId`를 기록한다. 같은 이메일 또는 같은 프로젝트·관리자 조합의 삭제 행을 재사용할 때에는 기존 행을 복구한다.

### API 응답과 비노출

- 목록은 `CreateResponse.list`를 사용한다.
- 성공·오류 본문은 기존 `CreateResponse` 계약을 따른다.
- 권한 부족은 `FORBIDDEN`으로 처리한다.
- 접근 가능한 대상이 아닌 관리자·프로젝트를 조회할 때는 `NOT_FOUND`로 처리해 존재를 숨긴다.
- 관리자 목록·검색은 서비스가 허용한 행만 조회한 뒤 페이지 정보를 계산한다.

## 화면 구조

- `/admins`: 관리자 목록, 검색, 활성 상태와 역할 표시
- `/admins/new`: 관리자 생성
- `/admins/:adminId`: 관리자 상세와 권한 요약
- `/admins/:adminId/edit`: 이름·역할·활성 상태 수정
- `/admins/:adminId/permissions`: 세부 권한 조회·수정
- `/projects/:projectId/admins`: 프로젝트 서브 어드민 초대·재초대·비활성화·배정 해제

페이지는 메타 설정과 데이터 조합만 담당한다. 실제 목록·폼·권한 편집은 `app/components/admin/` 및 `app/components/project/`의 CVA 컴포넌트로 분리한다. 모든 상호작용 함수는 `on<액션><대상>` 명명 규칙을 사용한다.

`SUB_ADMIN`에게는 관리자 관련 메뉴와 페이지 진입을 노출하지 않는다. 서버가 최종 권한 경계이므로 메뉴 비표시는 보조 수단이며, 직접 URL 접근도 동일한 권한 서비스에서 차단한다.

## 테스트 전략

테스트는 다음 순서로 작성한다.

1. 역할 기본값, override, 프로젝트 소유·배정, 역할 범위 밖 권한 거부를 권한 서비스 단위 테스트로 검증한다.
2. 관리자 API의 목록·생성·수정·삭제와 권한 API의 허용·거부를 handler 테스트로 검증한다.
3. 프로젝트 관리자 API의 초대·재초대·비활성화·배정 해제를 서비스와 handler에서 검증한다.
4. 관리자 화면이 API를 호출하고 로딩·오류·빈 상태를 표시하는지 UI 테스트로 검증한다.
5. 직접 URL, 목록, 검색, API에서 `SUB_ADMIN`과 타 프로젝트 관리자가 데이터를 볼 수 없는지 회귀 테스트로 검증한다.

단계 완료 조건은 대상 테스트, 전체 테스트, 타입 검사, 린트, 빌드가 모두 실행되고 결과가 `TODO.md`에 기록되는 것이다. 기존 무관 린트 오류는 변경 파일 검증과 분리해 기록한다.
