# 옴니노드 API 명세서

## 1. 문서 목적

이 문서는 옴니노드의 HTTP API 계약을 정의한다.

기준 문서는 `references/옴니노드 데이터베이스 명세서.md`이며, 데이터 소속 범위와 권한 정책은 DB 명세의 최신 확정안을 따른다.

API는 DB 테이블을 그대로 CRUD로 노출하지 않고 사용자가 수행하는 업무 단위와 Aggregate를 기준으로 설계한다.

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

## 2.2 HTTP 응답 상태 규칙

옴니노드 API는 **모든 정상적인 애플리케이션 응답을 HTTP 200으로 반환한다.**

성공, 입력 오류, 인증 실패, 권한 부족, 리소스 없음, 충돌, 서버 처리 오류 등의 구분은 HTTP Status가 아니라 응답 본문의 `error`, `code`, `message`로 처리한다.

```text
HTTP Status
→ 항상 200

실제 처리 결과
→ BaseResponse.error
→ BaseResponse.code
→ BaseResponse.message
```

예를 들어 존재하지 않는 리소스를 조회해도 HTTP Status 자체는 200이며 응답 코드는 `NOT_FOUND`를 사용한다.

---

## 2.3 공통 응답 형식

현재 코드의 `BaseResponse<TData>` 계약을 사용한다.

```ts
interface BaseResponse<TData> {
  data: TData | null;
  error: boolean;
  code: ResponseCode;
  message: ResponseMessage;
}
```

`code`는 숫자가 아니다.

`app/data/response-code.data.ts`에 정의된 코드 이름 문자열을 그대로 사용한다.

예:

```text
OK
CREATED
ACCEPTED
NO_CONTENT
BAD_REQUEST
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
UNPROCESSABLE_CONTENT
INTERNAL_SERVER_ERROR
```

### 성공 응답 예

HTTP Status:

```text
200
```

Body:

```json
{
  "data": {
    "id": 1
  },
  "error": false,
  "code": "OK",
  "message": "요청이 정상적으로 처리되었습니다."
}
```

생성 성공도 HTTP Status는 200이다.

```json
{
  "data": {
    "id": 10
  },
  "error": false,
  "code": "CREATED",
  "message": "리소스가 정상적으로 생성되었습니다."
}
```

### 오류 응답 예

HTTP Status:

```text
200
```

Body:

```json
{
  "data": null,
  "error": true,
  "code": "BAD_REQUEST",
  "message": "잘못된 요청입니다."
}
```

리소스를 찾지 못한 경우도 동일하다.

```json
{
  "data": null,
  "error": true,
  "code": "NOT_FOUND",
  "message": "요청한 리소스를 찾을 수 없습니다."
}
```

---

## 2.4 Response Code 사용 원칙

`ResponseCode`는 HTTP 상태를 직접 전달하는 값이 아니라 **처리 결과의 의미를 구분하기 위한 애플리케이션 코드**다.

현재 코드 정의를 기준으로 다음 계열을 사용할 수 있다.

### 성공 계열

```text
OK
CREATED
ACCEPTED
NO_CONTENT
```

### 요청 / 인증 / 권한 / 충돌 계열

```text
BAD_REQUEST
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
METHOD_NOT_ALLOWED
NOT_ACCEPTABLE
CONFLICT
GONE
PRECONDITION_FAILED
PAYLOAD_TOO_LARGE
UNSUPPORTED_MEDIA_TYPE
UNPROCESSABLE_CONTENT
TOO_MANY_REQUESTS
```

### 서버 처리 오류 계열

```text
INTERNAL_SERVER_ERROR
NOT_IMPLEMENTED
BAD_GATEWAY
SERVICE_UNAVAILABLE
GATEWAY_TIMEOUT
```

코드 이름은 기존 `responseCodeData`를 단일 기준으로 사용한다.

API 구현에서 임의의 숫자 코드나 별도의 도메인 문자열 코드를 만들지 않는다.

---

## 2.5 목록 응답 형식

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

## 2.6 공통 목록 파라미터

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

## 2.7 날짜

API 날짜 입출력은 UTC ISO 8601을 사용한다.

```text
2026-08-18T01:04:32.15Z
```

---

## 2.8 상태 변경

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

기본 데이터처럼 상태 변경이 허용되지 않는 리소스에는 해당 엔드포인트를 노출하지 않는다.

---

## 2.9 동일명 생성 요청과 복구

생성 API는 같은 업무 유일 범위에서 동일 이름 데이터를 먼저 조회한다.

```text
활성 동일명 존재
→ CONFLICT

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
3. 개별 생성/수정/삭제 권한은 `project_admin_permissions`의 21개 권한 컬럼으로 판정.

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

그 외 보호 API는 `FORBIDDEN`으로 처리한다.

---

# 4. Auth API

1. `POST /api/auth/signin` — 로그인.
2. `POST /api/auth/refresh` — Refresh Token 검증 및 Access Token 갱신.
3. `POST /api/auth/signout` — 로그아웃 및 Refresh Token 폐기.
4. `GET /api/auth/me` — 현재 관리자 조회.
5. `PATCH /api/auth/password` — 비밀번호 변경.

로그인 검증:

1. 이메일 존재.
2. `useYn=Y`.
3. `delYn=N`.
4. 비밀번호 일치.

인증 실패는 HTTP 200 + `UNAUTHORIZED`를 사용한다.

---

# 5. ADMIN 신청 API

1. `POST /api/admin-requests` — ADMIN 신청. 비로그인 허용.
2. `GET /api/admin-requests` — 신청 목록. SUPER_ADMIN 전용.
3. `GET /api/admin-requests/:requestId` — 신청 상세. SUPER_ADMIN 전용.
4. `POST /api/admin-requests/:requestId/approve` — 승인.
5. `POST /api/admin-requests/:requestId/reject` — 거절.

승인 transaction:

```text
PENDING 검증
→ admins 생성(role=ADMIN)
→ 임시 비밀번호 생성
→ passwordChangedYn=N
→ admin_requests.status=APPROVED
```

승인 과정에서 World를 생성하거나 자동 배정하지 않는다.

---

# 6. Admin API

1. `GET /api/admins` — 관리자 목록.
2. `GET /api/admins/:adminId` — 관리자 상세.
3. `PATCH /api/admins/:adminId` — 관리자 정보 수정.
4. `PATCH /api/admins/:adminId/status` — 관리자 활성/비활성.
5. `DELETE /api/admins/:adminId` — 관리자 소프트 삭제.
6. `POST /api/admins/:adminId/restore` — 관리자 복원.

일반 수정 가능 값은 `name` 중심으로 제한한다.

다음은 일반 수정 API에서 변경하지 않는다.

```text
email
role
password
passwordChangedYn
```

SUPER_ADMIN은 삭제할 수 없다.

---

# 7. World Admin / SUB_ADMIN API

1. `GET /api/worlds/:worldId/admins` — World 관리자 구성 조회.
2. `POST /api/worlds/:worldId/sub-admins` — 신규 SUB_ADMIN 생성 및 World 배정.
3. `POST /api/worlds/:worldId/sub-admins/:adminId` — 기존 SUB_ADMIN World 배정.
4. `DELETE /api/worlds/:worldId/sub-admins/:adminId` — World 배정 해제.

World 배정 해제는 `admins` 계정을 삭제하지 않고 `world_admins` 매핑만 소프트 삭제한다.

---

# 8. Project Permission API

1. `GET /api/projects/:projectId/sub-admins/:adminId/permissions` — 권한 조회.
2. `PUT /api/projects/:projectId/sub-admins/:adminId/permissions` — 21개 권한 전체 저장.
3. `PATCH /api/projects/:projectId/sub-admins/:adminId/permissions/status` — 권한 세트 활성/비활성.

활성 `project_admin_permissions`가 없으면 SUB_ADMIN은 해당 Project를 열람할 수 없다.

---

# 9. World API

1. `GET /api/worlds` — 접근 가능한 World 목록.
2. `POST /api/worlds` — World 생성.
3. `GET /api/worlds/:worldId` — World 상세.
4. `PATCH /api/worlds/:worldId` — World 수정.
5. `PATCH /api/worlds/:worldId/status` — World 활성/비활성.
6. `DELETE /api/worlds/:worldId` — World 소프트 삭제.
7. `POST /api/worlds/:worldId/restore` — World 복원.

ADMIN이 World를 생성하면 하나의 transaction에서:

```text
worlds 생성
→ world_admins 생성
→ 생성 ADMIN을 해당 World의 ADMIN으로 연결
```

하위 Project 상태는 연쇄 변경하지 않는다.

---

# 10. Project API

1. `GET /api/worlds/:worldId/projects` — World의 접근 가능한 Project 목록.
2. `POST /api/worlds/:worldId/projects` — Project 생성.
3. `GET /api/projects/:projectId` — Project 상세.
4. `PATCH /api/projects/:projectId` — Project 수정.
5. `PATCH /api/projects/:projectId/status` — Project 활성/비활성.
6. `DELETE /api/projects/:projectId` — Project 소프트 삭제.
7. `POST /api/projects/:projectId/restore` — Project 복원.

SUB_ADMIN은 활성 `project_admin_permissions`가 있는 Project만 목록과 상세에 접근할 수 있다.

---

# 11. Category API

Category는 기본 데이터와 Project 사용자 정의 데이터를 구분한다.

기본 Category는 시스템 전역이며 `project_categories`에 매핑하지 않는다.

사용자 정의 Category는 `project_categories`를 통해 Project에 귀속된다.

## 11.1 조회

1. `GET /api/projects/:projectId/categories`
   - 기본 Category 전체.
   - 해당 Project 사용자 정의 Category.
   - 문서 분류용.

2. `GET /api/worlds/:worldId/categories`
   - 기본 Category 전체.
   - 같은 World의 모든 Project 사용자 정의 Category.
   - Relationship 설정용.

## 11.2 변경

1. `POST /api/projects/:projectId/categories` — 사용자 정의 Category 생성.
2. `GET /api/categories/:categoryId` — 상세.
3. `PATCH /api/categories/:categoryId` — 이름 등 수정.
4. `PATCH /api/categories/:categoryId/status` — 활성/비활성.
5. `DELETE /api/categories/:categoryId` — 삭제.
6. `POST /api/categories/:categoryId/restore` — 명시적 복원.

기본 Category는 수정/삭제하지 않는다.

사용자 정의 Category 생성 transaction:

```text
categories 생성 또는 메인 row 복구
→ project_categories 신규 생성
```

Category는 생성 후 `parentId`, `depth`를 변경할 수 없다.

---

# 12. Template API

기본 Template은 시스템 전역이다.

사용자 정의 Template은 `project_templates`를 통해 Project에 귀속된다.

Template은 Category에 할당되지 않은 상태로 독립 존재할 수 있다.

## 12.1 조회

1. `GET /api/projects/:projectId/templates` — 해당 Project에서 사용 가능한 Template 및 적용 정보.
2. `GET /api/templates/:templateId` — Template 상세 + Heading 조회.

## 12.2 변경

1. `POST /api/projects/:projectId/templates` — 사용자 정의 Template 생성.
2. `PATCH /api/templates/:templateId` — Template 수정.
3. `PATCH /api/templates/:templateId/status` — 활성/비활성.
4. `DELETE /api/templates/:templateId` — 삭제.
5. `POST /api/templates/:templateId/restore` — 명시적 복원.
6. `PUT /api/templates/:templateId/headings` — Heading 전체 저장.
7. `PUT /api/projects/:projectId/templates/:templateId/category` — 선택적 Category 적용/해제.

`project_templates.categoryId = NULL`이면 Project에는 소속되어 있으나 Category에는 미할당 상태다.

---

# 13. Document / Revision API

Document는 Project 종속이다.

본문은 `document_revisions.content`가 정본이다.

## 13.1 Document

1. `GET /api/projects/:projectId/documents` — 목록.
2. `POST /api/projects/:projectId/documents` — 생성.
3. `GET /api/documents/:documentId` — 상세 + 현재 본문.
4. `PATCH /api/documents/:documentId` — 분류/본문 수정.
5. `PATCH /api/documents/:documentId/status` — 활성/비활성.
6. `DELETE /api/documents/:documentId` — 삭제.
7. `POST /api/documents/:documentId/restore` — 명시적 복원.

Document 제목은 생성 후 변경할 수 없다.

생성 transaction:

```text
documents 생성 또는 메인 row 복구
→ 최초 document_revisions 생성
→ currentYn=Y
```

동일 제목 삭제 Document를 생성 요청으로 복구하면 기존 Revision은 전부 폐기하고 신규 최초 Revision을 만든다.

## 13.2 Revision

1. `GET /api/documents/:documentId/revisions` — Revision 목록.
2. `GET /api/documents/:documentId/revisions/:revisionId` — Revision 상세.
3. `POST /api/documents/:documentId/revisions/:revisionId/restore` — Revision 복원.

본문 수정 시 기존 현재 본문과 동일하면 신규 Revision을 만들지 않는다.

Revision 복원은 신규 Revision을 생성하지 않고 `currentYn`만 전환한다.

---

# 14. Relationship Type API

Relationship Type은 기본 데이터 또는 World 사용자 정의 데이터다.

```text
기본
→ defaultYn=Y
→ worldId=NULL

사용자 정의
→ defaultYn=N
→ worldId=해당 World
```

## 14.1 조회

1. `GET /api/worlds/:worldId/relationship-types` — 해당 World에서 사용 가능한 기본 + 사용자 정의 Relationship Type 목록.
2. `GET /api/relationship-types/:relationshipTypeId` — Type + Role + 허용 Category 상세.

## 14.2 변경

1. `POST /api/worlds/:worldId/relationship-types` — 사용자 정의 Type 생성.
2. `PATCH /api/relationship-types/:relationshipTypeId` — Type 정보 수정.
3. `PUT /api/relationship-types/:relationshipTypeId/roles` — Role 및 허용 Category 전체 저장.
4. `PATCH /api/relationship-types/:relationshipTypeId/status` — 활성/비활성.
5. `DELETE /api/relationship-types/:relationshipTypeId` — 삭제.
6. `POST /api/relationship-types/:relationshipTypeId/restore` — 복원.

기본 Relationship Type은 수정/삭제하지 않는다.

복구 시 기존 Role/Category 매핑은 모두 폐기하고 새로 생성한다.

---

# 15. World Relationship Settings API

기본 Relationship Type의 World별 사용 여부와 Role별 추가 허용 Category를 관리한다.

1. `GET /api/worlds/:worldId/relationship-settings` — 전체 설정 조회.
2. `PUT /api/worlds/:worldId/relationship-types` — 기본 Relationship Type 사용 상태 전체 저장.
3. `PUT /api/worlds/:worldId/relationship-types/:relationshipTypeId/role-categories` — World 추가 허용 Category 저장.

사용자 정의 Relationship Type은 이미 `relationship_types.worldId`로 World에 직접 귀속되므로 `world_relationship_types`에 다시 매핑하지 않는다.

---

# 16. Actual Relationship API

Relationship 인스턴스는 World에 귀속된다.

같은 World라면 서로 다른 Project의 Document끼리 연결할 수 있다.

## 16.1 조회

1. `GET /api/worlds/:worldId/relationships` — World Relationship 목록.
2. `GET /api/documents/:documentId/relationships` — 특정 Document의 관계 목록.
3. `GET /api/relationships/:relationshipId` — Relationship 상세 + Target 조회.

## 16.2 변경

1. `POST /api/worlds/:worldId/relationships` — Relationship + Target 생성.
2. `PUT /api/relationships/:relationshipId` — Target 구성 전체 수정.
3. `PATCH /api/relationships/:relationshipId/status` — 활성/비활성.
4. `DELETE /api/relationships/:relationshipId` — 삭제.
5. `POST /api/relationships/:relationshipId/restore` — 복원.

`relationshipTypeId`는 생성 후 변경할 수 없다.

다른 Type이 필요하면 기존 Relationship을 삭제하고 신규 Relationship을 생성한다.

생성/수정 시 다음을 검증한다.

1. Target 수 2~4개.
2. Role이 해당 Relationship Type 소속인지.
3. 필수 Role이 모두 존재하는지.
4. 모든 Document가 Relationship과 같은 World인지.
5. 각 Document의 1단계 Category가 해당 Role의 허용 Category인지.
6. 기본 Type이면 해당 World에서 활성화되어 있는지.
7. 사용자 정의 Type이면 `relationshipType.worldId = relationship.worldId`인지.

---

# 17. 권한 적용 요약

## SUPER_ADMIN

모든 API 권한 검사 통과.

## ADMIN

1. 자신이 ADMIN인 World 전체 관리.
2. 해당 World의 모든 Project 접근.
3. World 생성 가능.

## SUB_ADMIN

1. `world_admins` 소속 필요.
2. Project 조회 자체에 활성 `project_admin_permissions` 필요.
3. Project 종속 Category / Template / Document 변경은 해당 Project의 권한을 사용.
4. World 범위 Relationship 관리 권한은 해당 관계 관리가 허용된 Project 권한 범위와 World 접근 범위를 함께 검증한다.

---

# 18. 오류 처리 기준

모든 오류도 HTTP 200으로 반환한다.

대표적인 매핑은 다음과 같다.

| 상황 | `error` | `code` |
| --- | :---: | --- |
| 정상 조회/수정 | `false` | `OK` |
| 정상 생성 | `false` | `CREATED` |
| 입력값 오류 | `true` | `BAD_REQUEST` 또는 `UNPROCESSABLE_CONTENT` |
| 인증 실패 | `true` | `UNAUTHORIZED` |
| 권한 부족 | `true` | `FORBIDDEN` |
| 데이터 없음 | `true` | `NOT_FOUND` |
| 활성 동일명 충돌 | `true` | `CONFLICT` |
| 서버 내부 처리 실패 | `true` | `INTERNAL_SERVER_ERROR` |

HTTP Status와 `code`를 동일한 개념으로 취급하지 않는다.

```text
HTTP Status = 200
code = 애플리케이션 처리 결과 문자열
```

---

# 19. API 설계 원칙 요약

1. 모든 애플리케이션 응답의 HTTP Status는 200으로 고정한다.
2. 결과 구분은 `error`, 문자열 `code`, `message`로 처리한다.
3. `code`는 `responseCodeData`의 코드 이름을 그대로 사용한다.
4. DB 매핑 테이블을 그대로 외부 CRUD로 노출하지 않는다.
5. 여러 테이블이 하나의 업무 단위를 구성하면 하나의 transaction으로 처리한다.
6. 기본 데이터와 사용자 정의 데이터의 소속 범위를 구분한다.
7. Project 종속 데이터는 Project 권한으로 관리한다.
8. Relationship Type과 실제 Relationship은 World 범위로 관리한다.
9. 같은 World의 서로 다른 Project Document를 Relationship으로 연결할 수 있다.
10. 삭제 동일명 생성 요청은 메인 row를 초기화 복구하고 기존 연관 데이터는 폐기 후 새로 생성한다.
11. Category의 `parentId/depth`, Document의 `title`, Relationship의 `relationshipTypeId`는 생성 후 불변이다.
