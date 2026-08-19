# 옴니노드 API 명세서

## 1. 문서 목적

이 문서는 옴니노드의 HTTP API 계약을 정의한다.

기준 문서는 `references/옴니노드 데이터베이스 명세서.md`이며, 데이터 소속 범위와 권한 정책은 DB 명세의 최신 확정안을 따른다.

API는 DB 테이블을 그대로 CRUD로 노출하지 않고, 사용자가 수행하는 업무 단위와 Aggregate를 기준으로 설계한다.

```text
Admin
World
Project
Category
Template
Document
Relationship
```

매핑 테이블과 연관 테이블은 가능한 한 상위 도메인 API 내부에서 처리한다.

---

# 2. 공통 규칙

## 2.1 기본 경로

```text
/api
```

모든 엔드포인트는 `/api` 하위에 둔다.

---

## 2.2 공통 응답 형식

현재 코드의 `BaseResponse<TData>` 계약을 사용한다.

```ts
interface BaseResponse<TData> {
  data: TData | null;
  error: boolean;
  code: ResponseCode;
  message: ResponseMessage;
}
```

성공 응답 예:

```json
{
  "data": {
    "id": 1
  },
  "error": false,
  "code": 200,
  "message": "요청이 정상적으로 처리되었습니다."
}
```

오류 응답도 같은 외피를 사용한다.

```json
{
  "data": null,
  "error": true,
  "code": 400,
  "message": "요청을 처리할 수 없습니다."
}
```

---

## 2.3 목록 응답 형식

현재 코드의 `ListData<TData>` 계약을 사용한다.

```ts
interface ListData<TData> {
  list: TData[];
  page: number;
  pageSize: number;
  totalElements: number;
  numberOfElements: number;
  startIndex: number;
  endIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
  isFirst: boolean;
  isLast: boolean;
  empty: boolean;
  totalPages: number;
}
```

목록 응답은 `BaseResponse<ListData<TData>>` 형태다.

---

## 2.4 공통 목록 파라미터

일반 목록 API는 필요에 따라 다음 파라미터를 사용한다.

| 이름 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `page` | number | `0` | 0부터 시작하는 페이지 번호 |
| `pageSize` | number | `20` | 페이지 크기 |
| `keyword` | string | 없음 | 이름/제목 등 도메인별 검색어 |
| `useYn` | `Y/N` | 없음 | 사용 상태 필터 |
| `delYn` | `Y/N` | `N` | 삭제 상태 필터 |
| `sort` | string | 도메인별 | 정렬 컬럼 |
| `order` | `asc/desc` | 도메인별 | 정렬 방향 |

일반 화면은 `delYn=N`을 기본으로 한다.

삭제 목록은 동일 목록 API에서 `delYn=Y`로 조회한다.

---

## 2.5 날짜

API 날짜 입출력은 UTC ISO 8601을 사용한다.

```text
2026-08-18T01:04:32.15Z
```

---

## 2.6 상태 변경

`useYn` 비활성과 `delYn` 삭제는 서로 다른 행위다.

```text
useYn = N / delYn = N
→ 비활성

delYn = Y
→ 소프트 삭제
```

일반 패턴은 다음과 같다.

```http
PATCH /api/{resource}/:id/status
DELETE /api/{resource}/:id
POST /api/{resource}/:id/restore
```

다만 기본 데이터처럼 상태 변경이 허용되지 않는 리소스에는 해당 엔드포인트를 노출하지 않는다.

---

## 2.7 동일명 생성 요청과 복구

생성 API는 같은 업무 유일 범위에서 동일 이름 데이터를 먼저 조회한다.

```text
활성 동일명 존재
→ 중복 오류

삭제 동일명 존재
→ 메인 row만 초기화 복구
→ 기존 연관 데이터 useYn=N, delYn=Y
→ 연관 데이터 신규 생성

동일명 없음
→ 신규 생성
```

복구 시 메인 row의 `id`, `createId`, `createDate`는 유지한다.

---

# 3. 인증 및 접근 권한

## 3.1 역할

```text
SUPER_ADMIN
ADMIN
SUB_ADMIN
```

### SUPER_ADMIN

1. 시스템 전체 접근 가능.
2. 모든 World / Project 접근 가능.
3. `world_admins`, `project_admin_permissions` 없이 접근 가능.

### ADMIN

1. SUPER_ADMIN 승인으로 생성.
2. World가 없는 상태로 존재 가능.
3. 직접 World를 생성할 수 있음.
4. 자신이 ADMIN으로 연결된 World의 모든 Project에 접근 가능.

### SUB_ADMIN

1. `world_admins`를 통해 World에 소속.
2. 활성 `project_admin_permissions`가 있는 Project만 열람 가능.
3. 개별 C/U/D 권한은 `project_admin_permissions`의 21개 권한 컬럼으로 판정.

---

## 3.2 최초 비밀번호 변경 제한

```text
passwordChangedYn = N
```

인 ADMIN/SUB_ADMIN은 다음 기능만 사용할 수 있다.

1. 현재 계정 조회.
2. 비밀번호 변경.
3. 로그아웃.
4. 토큰 갱신.

그 외 보호 API는 거부한다.

---

# 4. Auth API

## 4.1 로그인

```http
POST /api/auth/signin
```

### Request

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

### 검증

1. 이메일 존재.
2. `useYn=Y`.
3. `delYn=N`.
4. 비밀번호 일치.

### Response Data

```json
{
  "admin": {
    "id": 1,
    "email": "admin@example.com",
    "name": "관리자",
    "role": "ADMIN",
    "passwordChangedYn": "N"
  }
}
```

---

## 4.2 토큰 갱신

```http
POST /api/auth/refresh
```

관리자 상태가 비활성 또는 삭제이면 갱신하지 않는다.

---

## 4.3 로그아웃

```http
POST /api/auth/signout
```

Refresh Token을 폐기하고 인증 쿠키를 제거한다.

---

## 4.4 현재 관리자 조회

```http
GET /api/auth/me
```

### Response Data

```json
{
  "id": 1,
  "email": "admin@example.com",
  "name": "관리자",
  "role": "ADMIN",
  "passwordChangedYn": "Y"
}
```

World / Project 접근 목록 전체는 이 API에 포함하지 않는다.

---

## 4.5 비밀번호 변경

```http
PATCH /api/auth/password
```

### Request

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

성공 시 `passwordChangedYn=Y`로 변경한다.

---

# 5. ADMIN 신청 API

## 5.1 신청

```http
POST /api/admin-requests
```

비로그인 접근을 허용한다.

### Request

```json
{
  "email": "admin@example.com",
  "name": "관리자"
}
```

### 검증

1. `admins.email`에 동일 이메일이 없어야 함.
2. 동일 이메일 활성 `PENDING` 요청이 없어야 함.
3. 과거 `REJECTED` 요청 존재는 허용.

---

## 5.2 신청 목록

```http
GET /api/admin-requests
```

SUPER_ADMIN 전용.

추가 필터:

```text
status
keyword
```

---

## 5.3 신청 상세

```http
GET /api/admin-requests/:requestId
```

SUPER_ADMIN 전용.

---

## 5.4 승인

```http
POST /api/admin-requests/:requestId/approve
```

SUPER_ADMIN 전용.

하나의 트랜잭션에서:

```text
PENDING 검증
→ admins 생성(role=ADMIN)
→ 임시 비밀번호 생성
→ passwordChangedYn=N
→ admin_requests.status=APPROVED
```

승인 과정에서 World를 생성하거나 배정하지 않는다.

DB commit 이후 계정 정보 이메일을 전송한다.

---

## 5.5 거절

```http
POST /api/admin-requests/:requestId/reject
```

SUPER_ADMIN 전용.

---

# 6. Admin API

## 6.1 관리자 목록

```http
GET /api/admins
```

주요 필터:

```text
role
keyword
useYn
delYn
```

---

## 6.2 관리자 상세

```http
GET /api/admins/:adminId
```

비밀번호 해시는 절대 반환하지 않는다.

---

## 6.3 관리자 수정

```http
PATCH /api/admins/:adminId
```

일반 수정 가능 값은 `name` 중심으로 제한한다.

다음 값은 일반 수정 API로 변경하지 않는다.

```text
email
role
password
passwordChangedYn
```

---

## 6.4 관리자 상태 변경

```http
PATCH /api/admins/:adminId/status
```

### Request

```json
{
  "useYn": "N"
}
```

SUPER_ADMIN 삭제/비활성 정책은 별도 보호한다.

---

## 6.5 관리자 삭제

```http
DELETE /api/admins/:adminId
```

소프트 삭제.

SUPER_ADMIN은 삭제할 수 없다.

---

## 6.6 관리자 복원

```http
POST /api/admins/:adminId/restore
```

---

# 7. World Admin / SUB_ADMIN API

## 7.1 World 관리자 구성 조회

```http
GET /api/worlds/:worldId/admins
```

### Response Data 예시

```json
{
  "admin": {
    "id": 2,
    "email": "admin@example.com",
    "name": "ADMIN"
  },
  "subAdmins": []
}
```

---

## 7.2 신규 SUB_ADMIN 생성 및 World 배정

```http
POST /api/worlds/:worldId/sub-admins
```

### Request

```json
{
  "email": "sub@example.com",
  "name": "서브 관리자"
}
```

처리:

```text
admins 생성(role=SUB_ADMIN)
→ 임시 비밀번호
→ passwordChangedYn=N
→ world_admins 생성
```

---

## 7.3 기존 SUB_ADMIN World 배정

```http
POST /api/worlds/:worldId/sub-admins/:adminId
```

이미 삭제된 동일 `world_admins` 매핑이 있으면 해당 메인 매핑을 초기화 복구한다.

---

## 7.4 SUB_ADMIN World 배정 해제

```http
DELETE /api/worlds/:worldId/sub-admins/:adminId
```

`admins` 계정 자체를 삭제하지 않고 `world_admins` 매핑만 소프트 삭제한다.

---

# 8. Project Permission API

## 8.1 권한 조회

```http
GET /api/projects/:projectId/sub-admins/:adminId/permissions
```

---

## 8.2 권한 전체 저장

```http
PUT /api/projects/:projectId/sub-admins/:adminId/permissions
```

21개 권한 세트를 전체 교체한다.

부분 PATCH보다 전체 상태를 명시하는 PUT을 사용한다.

대상은 반드시 SUB_ADMIN이어야 하며 해당 World의 `world_admins`에 등록되어 있어야 한다.

---

## 8.3 권한 세트 활성/비활성

```http
PATCH /api/projects/:projectId/sub-admins/:adminId/permissions/status
```

`useYn=N`이면 21개 권한값은 유지하고 Project 접근 전체를 비활성화한다.

---

# 9. World API

## 9.1 World 목록

```http
GET /api/worlds
```

접근 범위:

1. SUPER_ADMIN → 전체.
2. ADMIN → 자신이 ADMIN으로 연결된 World.
3. SUB_ADMIN → 자신이 `world_admins`로 연결된 World.

---

## 9.2 World 생성

```http
POST /api/worlds
```

ADMIN이 직접 생성할 수 있다.

### Request

```json
{
  "name": "룩스테라"
}
```

ADMIN이 생성하는 경우 하나의 트랜잭션에서:

```text
worlds 생성
→ world_admins 생성
→ 생성 ADMIN을 해당 World의 ADMIN으로 연결
```

---

## 9.3 World 상세

```http
GET /api/worlds/:worldId
```

---

## 9.4 World 수정

```http
PATCH /api/worlds/:worldId
```

---

## 9.5 World 상태 변경

```http
PATCH /api/worlds/:worldId/status
```

하위 Project의 상태를 연쇄 변경하지 않는다.

---

## 9.6 World 삭제

```http
DELETE /api/worlds/:worldId
```

하위 데이터를 연쇄 삭제하지 않는다.

---

## 9.7 World 복원

```http
POST /api/worlds/:worldId/restore
```

---

# 10. Project API

## 10.1 World의 Project 목록

```http
GET /api/worlds/:worldId/projects
```

SUB_ADMIN은 활성 `project_admin_permissions`가 존재하는 Project만 반환한다.

---

## 10.2 Project 생성

```http
POST /api/worlds/:worldId/projects
```

같은 World 안에서 활성 동일 이름 Project는 생성할 수 없다.

삭제 동일 이름 Project가 있으면 메인 row를 초기화 복구한다.

---

## 10.3 Project 상세

```http
GET /api/projects/:projectId
```

SUB_ADMIN은 활성 `project_admin_permissions`가 없으면 접근할 수 없다.

---

## 10.4 Project 수정

```http
PATCH /api/projects/:projectId
```

---

## 10.5 Project 상태 변경

```http
PATCH /api/projects/:projectId/status
```

---

## 10.6 Project 삭제

```http
DELETE /api/projects/:projectId
```

---

## 10.7 Project 복원

```http
POST /api/projects/:projectId/restore
```

복원 시 같은 World에 활성 동일 이름 Project가 존재하면 복원할 수 없다.

---

# 11. Category API

Category는 기본 데이터와 Project 사용자 정의 데이터를 구분한다.

기본 Category는 시스템 전역이며 `project_categories`에 매핑하지 않는다.

사용자 정의 Category는 `project_categories`를 통해 Project에 귀속된다.

---

## 11.1 Project에서 사용할 수 있는 Category 조회

```http
GET /api/projects/:projectId/categories
```

반환 범위:

```text
기본 Category 전체
+
해당 Project의 사용자 정의 Category
```

트리 형태로 반환한다.

다른 Project의 사용자 정의 Category는 일반 문서 분류용 조회에 포함하지 않는다.

---

## 11.2 World Relation 설정용 Category 조회

```http
GET /api/worlds/:worldId/categories
```

반환 범위:

```text
기본 Category 전체
+
같은 World에 속한 모든 Project 사용자 정의 Category
```

Relationship Type 역할 허용 Category 설정 등 World 관계 관리에서 사용한다.

---

## 11.3 사용자 정의 Category 생성

```http
POST /api/projects/:projectId/categories
```

### Request

```json
{
  "name": "기사",
  "parentId": 1
}
```

서버가 `parentId`를 기준으로 depth를 계산한다.

하나의 트랜잭션에서:

```text
categories 생성 또는 메인 row 복구
→ project_categories 신규 생성
```

### 부모 규칙

1. 기본 Category 가능.
2. 같은 Project 사용자 정의 Category 가능.
3. 다른 Project 사용자 정의 Category 불가.
4. depth 3 아래 신규 생성 불가.

---

## 11.4 Category 상세

```http
GET /api/categories/:categoryId
```

---

## 11.5 Category 수정

```http
PATCH /api/categories/:categoryId
```

사용자 정의 Category만 수정 가능.

`name`만 일반 수정 대상으로 본다.

다음은 생성 후 변경할 수 없다.

```text
parentId
depth
```

---

## 11.6 Category 상태 변경

```http
PATCH /api/categories/:categoryId/status
```

사용자 정의 Category만 대상.

---

## 11.7 Category 삭제

```http
DELETE /api/categories/:categoryId
```

기본 Category 삭제 불가.

---

## 11.8 Category 복원

```http
POST /api/categories/:categoryId/restore
```

명시적 복원은 기존 Category 자체를 복원한다.

동일명 신규 생성에 의한 복구는 기존 연관 매핑을 폐기하고 새 `project_categories`를 생성한다.

---

# 12. Template API

기본 Template은 시스템 전역이다.

사용자 정의 Template은 `project_templates`를 통해 Project에 귀속된다.

Template은 Category에 할당되지 않아도 독립적으로 존재할 수 있다.

---

## 12.1 Project Template 목록

```http
GET /api/projects/:projectId/templates
```

반환 범위:

```text
기본 Template
+
해당 Project 사용자 정의 Template
```

각 항목에 Category 적용 여부를 포함한다.

---

## 12.2 사용자 정의 Template 생성

```http
POST /api/projects/:projectId/templates
```

### Request 예시

```json
{
  "name": "인물 상세",
  "categoryId": null,
  "headings": [
    {
      "label": "개요",
      "level": 1,
      "sortOrder": 1
    }
  ]
}
```

`categoryId`는 선택 값이다.

하나의 트랜잭션에서:

```text
templates 생성 또는 메인 row 복구
→ template_headings 신규 생성
→ project_templates 신규 생성
```

---

## 12.3 Template 상세

```http
GET /api/templates/:templateId
```

Heading 목록을 함께 반환한다.

---

## 12.4 Template 수정

```http
PATCH /api/templates/:templateId
```

사용자 정의 Template만 수정 가능.

기본 Template 수정 불가.

---

## 12.5 Template Heading 전체 저장

```http
PUT /api/templates/:templateId/headings
```

Heading은 Template Aggregate의 일부로 관리한다.

개별 `template_headings` CRUD API는 제공하지 않는다.

---

## 12.6 Template 상태 변경

```http
PATCH /api/templates/:templateId/status
```

사용자 정의 Template만 대상.

---

## 12.7 Template 삭제

```http
DELETE /api/templates/:templateId
```

---

## 12.8 Template 복원

```http
POST /api/templates/:templateId/restore
```

---

## 12.9 Template Category 적용

```http
PUT /api/projects/:projectId/templates/:templateId/category
```

### Request

```json
{
  "categoryId": 1
}
```

미할당 상태로 만들려면:

```json
{
  "categoryId": null
}
```

적용 Category는 1단계 Category만 허용한다.

사용자 정의 Category라면 동일 Project에 속해야 한다.

---

# 13. Document / Revision API

Document와 Revision은 하나의 Aggregate로 취급한다.

Document 메인 row에는 본문을 저장하지 않는다.

---

## 13.1 Project Document 목록

```http
GET /api/projects/:projectId/documents
```

필터 후보:

```text
keyword
categoryId
subCategory1Id
subCategory2Id
useYn
delYn
```

---

## 13.2 Document 생성

```http
POST /api/projects/:projectId/documents
```

### Request

```json
{
  "title": "아미유",
  "categoryId": 1,
  "subCategory1Id": null,
  "subCategory2Id": null,
  "content": "# 개요\n"
}
```

하나의 트랜잭션에서:

```text
documents 생성 또는 메인 row 복구
→ document_revisions 최초 Revision 생성
→ currentYn=Y
```

삭제 동일 제목 Document 복구 시 기존 Revision은 모두 폐기한다.

---

## 13.3 Document 상세

```http
GET /api/documents/:documentId
```

현재 Revision의 content를 함께 반환한다.

---

## 13.4 Document 수정

```http
PATCH /api/documents/:documentId
```

수정 가능:

```text
categoryId
subCategory1Id
subCategory2Id
content
```

수정 불가:

```text
title
```

content가 현재 Revision과 동일하면 신규 Revision을 만들지 않는다.

다르면:

```text
기존 currentYn=N
→ 신규 Revision 생성
→ 신규 currentYn=Y
```

---

## 13.5 Document 상태 변경

```http
PATCH /api/documents/:documentId/status
```

---

## 13.6 Document 삭제

```http
DELETE /api/documents/:documentId
```

---

## 13.7 Document 복원

```http
POST /api/documents/:documentId/restore
```

---

## 13.8 Revision 목록

```http
GET /api/documents/:documentId/revisions
```

---

## 13.9 Revision 상세

```http
GET /api/documents/:documentId/revisions/:revisionId
```

---

## 13.10 Revision 복원

```http
POST /api/documents/:documentId/revisions/:revisionId/restore
```

신규 Revision을 생성하지 않는다.

```text
기존 currentYn=N
→ 선택 Revision currentYn=Y
```

---

# 14. Relationship Type API

기본 Relationship Type은 시스템 전역이다.

사용자 정의 Relationship Type은 World 종속이다.

---

## 14.1 World에서 사용 가능한 Relationship Type 목록

```http
GET /api/worlds/:worldId/relationship-types
```

반환 범위:

```text
해당 World에서 활성화된 기본 Relationship Type
+
해당 World 사용자 정의 Relationship Type
```

---

## 14.2 사용자 정의 Relationship Type 생성

```http
POST /api/worlds/:worldId/relationship-types
```

### Request 예시

```json
{
  "name": "수호",
  "reverseName": "보호받음",
  "directionType": "DIRECTED",
  "displayTemplate": "{1}은 {2}을 수호한다.",
  "roles": [
    {
      "name": "수호자",
      "sortOrder": 1,
      "requiredYn": "Y",
      "categoryIds": [1]
    },
    {
      "name": "대상",
      "sortOrder": 2,
      "requiredYn": "Y",
      "categoryIds": [2]
    }
  ]
}
```

하나의 트랜잭션에서:

```text
relationship_types 생성 또는 메인 row 복구
→ relationship_roles 신규 생성
→ relationship_role_categories 신규 생성
```

역할 수는 2~4개다.

---

## 14.3 Relationship Type 상세

```http
GET /api/relationship-types/:relationshipTypeId
```

Role과 허용 Category를 함께 반환한다.

---

## 14.4 Relationship Type 수정

```http
PATCH /api/relationship-types/:relationshipTypeId
```

사용자 정의 Type만 수정 가능.

일반 속성:

```text
name
reverseName
directionType
displayTemplate
```

---

## 14.5 Role 구성 전체 저장

```http
PUT /api/relationship-types/:relationshipTypeId/roles
```

개별 Role/Role-Category CRUD는 외부 API로 노출하지 않는다.

---

## 14.6 Relationship Type 상태 변경

```http
PATCH /api/relationship-types/:relationshipTypeId/status
```

사용자 정의 Type만 대상.

---

## 14.7 Relationship Type 삭제

```http
DELETE /api/relationship-types/:relationshipTypeId
```

기본 Type 삭제 불가.

---

## 14.8 Relationship Type 복원

```http
POST /api/relationship-types/:relationshipTypeId/restore
```

동일명 생성 요청에 의한 복구라면 기존 Role/Category 매핑을 폐기하고 신규 구성으로 재생성한다.

---

# 15. World Relationship 설정 API

## 15.1 설정 조회

```http
GET /api/worlds/:worldId/relationship-settings
```

기본 Relationship Type 사용 여부와 World 추가 허용 Category 설정을 조회한다.

---

## 15.2 기본 Relationship Type 사용 설정

```http
PUT /api/worlds/:worldId/relationship-types
```

### Request 예시

```json
{
  "relationshipTypes": [
    {
      "relationshipTypeId": 1,
      "useYn": "Y"
    }
  ]
}
```

`defaultYn=Y`인 Type만 허용한다.

---

## 15.3 World 추가 허용 Category 설정

```http
PUT /api/worlds/:worldId/relationship-types/:relationshipTypeId/role-categories
```

기본 Role 허용 Category에 World별 Category를 추가한다.

사용자 정의 Category라면 같은 World에 속한 Project의 Category여야 한다.

---

# 16. Actual Relationship API

실제 Relationship은 World 종속이다.

같은 World라면 서로 다른 Project의 Document를 하나의 Relationship으로 묶을 수 있다.

---

## 16.1 World Relationship 목록

```http
GET /api/worlds/:worldId/relationships
```

필터 후보:

```text
relationshipTypeId
documentId
useYn
delYn
```

---

## 16.2 Relationship 생성

```http
POST /api/worlds/:worldId/relationships
```

### Request

```json
{
  "relationshipTypeId": 1,
  "targets": [
    {
      "relationshipRoleId": 10,
      "documentId": 100
    },
    {
      "relationshipRoleId": 11,
      "documentId": 200
    }
  ]
}
```

### 검증

1. 대상 수 2~4개.
2. Role은 해당 Relationship Type 소속.
3. 필수 Role 모두 존재.
4. 모든 Document는 요청 World에 속함.
5. 서로 다른 Project Document 허용.
6. 각 Document의 1단계 Category가 해당 Role 최종 허용 범위에 포함.
7. 기본 Type이면 `world_relationship_types`에서 활성 상태.
8. 사용자 정의 Type이면 `relationshipType.worldId = 요청 worldId`.

하나의 트랜잭션에서:

```text
relationships 생성
→ relationship_targets 생성
```

---

## 16.3 Relationship 상세

```http
GET /api/relationships/:relationshipId
```

Relationship Type과 Target Document/Role 정보를 함께 반환한다.

---

## 16.4 Document의 Relationship 조회

```http
GET /api/documents/:documentId/relationships
```

해당 Document가 참여하는 Relationship, Role, 상대 Document를 조회한다.

---

## 16.5 Relationship 수정

```http
PUT /api/relationships/:relationshipId
```

Target 구성 전체를 교체한다.

다음 값은 변경할 수 없다.

```text
relationshipTypeId
worldId
```

Type 변경이 필요하면 기존 Relationship을 삭제하고 새 Relationship을 생성한다.

---

## 16.6 Relationship 상태 변경

```http
PATCH /api/relationships/:relationshipId/status
```

---

## 16.7 Relationship 삭제

```http
DELETE /api/relationships/:relationshipId
```

---

## 16.8 Relationship 복원

```http
POST /api/relationships/:relationshipId/restore
```

---

# 17. 권한 매핑

SUB_ADMIN의 쓰기 권한은 다음과 대응한다.

| 도메인 | Create | Update | Delete |
| --- | --- | --- | --- |
| World | `worldCreateYn` | `worldUpdateYn` | `worldDeleteYn` |
| Project | `projectCreateYn` | `projectUpdateYn` | `projectDeleteYn` |
| Category | `categoryCreateYn` | `categoryUpdateYn` | `categoryDeleteYn` |
| Template | `templateCreateYn` | `templateUpdateYn` | `templateDeleteYn` |
| Relationship | `relationshipCreateYn` | `relationshipUpdateYn` | `relationshipDeleteYn` |
| Document | `documentCreateYn` | `documentUpdateYn` | `documentDeleteYn` |
| SUB_ADMIN 초대 | `subAdminInviteCreateYn` | `subAdminInviteUpdateYn` | `subAdminInviteDeleteYn` |

Project 열람 자체는 해당 Project의 활성 `project_admin_permissions` 존재 여부로 판정한다.

---

# 18. Aggregate 처리 원칙

다음 DB 테이블은 외부 API에서 독립 CRUD 자원으로 노출하지 않는다.

1. `world_admins`
   - World Admin/SUB_ADMIN API에 흡수.

2. `project_admin_permissions`
   - Project Permission API에 흡수.

3. `project_categories`
   - Category 생성/복구 과정에 흡수.

4. `template_headings`
   - Template Aggregate에 흡수.

5. `project_templates`
   - Template 소속/Category 적용 API에 흡수.

6. `relationship_roles`
   - Relationship Type Aggregate에 흡수.

7. `relationship_role_categories`
   - Relationship Type Role 설정에 흡수.

8. `world_relationship_types`
   - World Relationship 설정에 흡수.

9. `world_relationship_role_categories`
   - World Relationship 설정에 흡수.

10. `relationship_targets`
   - Actual Relationship Aggregate에 흡수.

11. `document_revisions`
   - 직접 생성/수정 CRUD는 제공하지 않으며 조회와 복원만 노출.

---

# 19. 엔드포인트 요약

## Auth

```text
POST  /api/auth/signin
POST  /api/auth/refresh
POST  /api/auth/signout
GET   /api/auth/me
PATCH /api/auth/password
```

## ADMIN 신청

```text
POST /api/admin-requests
GET  /api/admin-requests
GET  /api/admin-requests/:requestId
POST /api/admin-requests/:requestId/approve
POST /api/admin-requests/:requestId/reject
```

## Admin

```text
GET    /api/admins
GET    /api/admins/:adminId
PATCH  /api/admins/:adminId
PATCH  /api/admins/:adminId/status
DELETE /api/admins/:adminId
POST   /api/admins/:adminId/restore
```

## World Admin / SUB_ADMIN

```text
GET    /api/worlds/:worldId/admins
POST   /api/worlds/:worldId/sub-admins
POST   /api/worlds/:worldId/sub-admins/:adminId
DELETE /api/worlds/:worldId/sub-admins/:adminId
```

## Project Permission

```text
GET   /api/projects/:projectId/sub-admins/:adminId/permissions
PUT   /api/projects/:projectId/sub-admins/:adminId/permissions
PATCH /api/projects/:projectId/sub-admins/:adminId/permissions/status
```

## World

```text
GET    /api/worlds
POST   /api/worlds
GET    /api/worlds/:worldId
PATCH  /api/worlds/:worldId
PATCH  /api/worlds/:worldId/status
DELETE /api/worlds/:worldId
POST   /api/worlds/:worldId/restore
```

## Project

```text
GET    /api/worlds/:worldId/projects
POST   /api/worlds/:worldId/projects
GET    /api/projects/:projectId
PATCH  /api/projects/:projectId
PATCH  /api/projects/:projectId/status
DELETE /api/projects/:projectId
POST   /api/projects/:projectId/restore
```

## Category

```text
GET    /api/projects/:projectId/categories
GET    /api/worlds/:worldId/categories
POST   /api/projects/:projectId/categories
GET    /api/categories/:categoryId
PATCH  /api/categories/:categoryId
PATCH  /api/categories/:categoryId/status
DELETE /api/categories/:categoryId
POST   /api/categories/:categoryId/restore
```

## Template

```text
GET    /api/projects/:projectId/templates
POST   /api/projects/:projectId/templates
GET    /api/templates/:templateId
PATCH  /api/templates/:templateId
PUT    /api/templates/:templateId/headings
PATCH  /api/templates/:templateId/status
DELETE /api/templates/:templateId
POST   /api/templates/:templateId/restore
PUT    /api/projects/:projectId/templates/:templateId/category
```

## Document / Revision

```text
GET    /api/projects/:projectId/documents
POST   /api/projects/:projectId/documents
GET    /api/documents/:documentId
PATCH  /api/documents/:documentId
PATCH  /api/documents/:documentId/status
DELETE /api/documents/:documentId
POST   /api/documents/:documentId/restore
GET    /api/documents/:documentId/revisions
GET    /api/documents/:documentId/revisions/:revisionId
POST   /api/documents/:documentId/revisions/:revisionId/restore
```

## Relationship Type

```text
GET    /api/worlds/:worldId/relationship-types
POST   /api/worlds/:worldId/relationship-types
GET    /api/relationship-types/:relationshipTypeId
PATCH  /api/relationship-types/:relationshipTypeId
PUT    /api/relationship-types/:relationshipTypeId/roles
PATCH  /api/relationship-types/:relationshipTypeId/status
DELETE /api/relationship-types/:relationshipTypeId
POST   /api/relationship-types/:relationshipTypeId/restore
```

## World Relationship 설정

```text
GET /api/worlds/:worldId/relationship-settings
PUT /api/worlds/:worldId/relationship-types
PUT /api/worlds/:worldId/relationship-types/:relationshipTypeId/role-categories
```

## Actual Relationship

```text
GET    /api/worlds/:worldId/relationships
POST   /api/worlds/:worldId/relationships
GET    /api/relationships/:relationshipId
GET    /api/documents/:documentId/relationships
PUT    /api/relationships/:relationshipId
PATCH  /api/relationships/:relationshipId/status
DELETE /api/relationships/:relationshipId
POST   /api/relationships/:relationshipId/restore
```

---

# 20. 구현 순서

API 구현은 다음 순서로 진행한다.

1. 공통 응답 / 오류 / 인증 유틸리티.
2. Auth.
3. ADMIN 신청 / Admin.
4. World / World Admin / SUB_ADMIN.
5. Project / Project Permission.
6. Category.
7. Template.
8. Document / Revision.
9. Relationship Type / World Relationship 설정.
10. Actual Relationship.

DB 구조가 API 계약의 전제가 되므로, 실제 서버 API 구현 전에 최신 DB 명세에 맞춰 Drizzle 스키마를 먼저 정합화한다.
