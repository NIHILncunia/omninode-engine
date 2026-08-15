# 옴니노드 UI·API 통합 작업 설계서

## 1. 문서 목적

이 문서는 옴니노드의 현재 라우트 골격과 데이터베이스 스키마를 실제 동작하는 서비스로 전환하기 위한 작업 순서와 구현 기준을 정의한다.

각 단계는 화면만 먼저 만들거나 API만 먼저 만드는 방식으로 진행하지 않는다. 하나의 기능 단위를 UI, API, 권한, 데이터 검증, 테스트까지 연결하는 수직 슬라이스 방식으로 완성한다.

## 2. 기준 상태

원격 저장소의 기준 브랜치는 `master`다. 현재 라우트는 62개이며, 대부분 메타 설정과 빈 루트만 가진 라우트 골격이다.

현재 서버에는 Drizzle 스키마가 존재하지만 `server/api/`의 실제 도메인 API는 아직 구현되지 않았다. 따라서 이번 작업의 핵심은 공통 실행 기반을 먼저 만들고, 이후 기능 단위를 순서대로 완성하는 것이다.

현재 로그인 라우트의 이름은 `/signin`이며 Vue 파일은 `app/pages/signin.vue`다.

## 3. 기본 원칙

### 3.1 작업 단위

각 작업은 다음 흐름을 반드시 거친다.

```text
요구사항 확인
→ 화면·API 계약 확정
→ 실패하는 테스트 작성
→ API 구현
→ UI 구현
→ 권한·오류·빈 상태 처리
→ 통합 검증
→ 작업 기록 및 커밋
```

### 3.2 데이터 접근 원칙

- 모든 도메인 데이터는 API를 통해 접근한다.
- UI 컴포넌트가 Drizzle 스키마나 DB 구현에 직접 의존하지 않는다.
- API는 인증된 관리자와 프로젝트 접근 범위를 항상 확인한다.
- 상위 데이터가 삭제되어도 하위 데이터의 `delYn`은 변경하지 않는다.
- 상위 데이터가 삭제된 동안에는 하위 데이터의 접근만 차단한다.
- 삭제 데이터와 같은 이름으로 새 데이터를 만들 경우 기존 삭제 데이터를 복구한다.
- 생성·수정·삭제는 명시적인 저장 또는 삭제 요청 시에만 실행한다.

### 3.3 권한 원칙

- `SUPER_ADMIN`은 전체 시스템을 관리한다.
- `ADMIN`은 자신이 생성한 프로젝트를 관리한다.
- `SUB_ADMIN`은 배정된 프로젝트에서 문서·카테고리·템플릿만 관리한다.
- `SUB_ADMIN`은 프로젝트·월드·계정·관계 관리에 접근할 수 없다.
- 역할 기본 권한에 관리자별 `adminPermissions` 설정을 덧씌운다.
- 권한이 없는 데이터는 목록, 검색, 직접 URL, API 응답에서 존재를 노출하지 않는다.

## 4. 시스템 구성

### 4.1 프론트엔드

- Nuxt 4 파일 기반 라우팅
- 페이지: 라우팅과 데이터 조합만 담당
- 도메인 컴포넌트: 목록, 폼, 상세, 편집 UI 담당
- `useGet`, `usePost`, `usePut`, `usePatch`, `useDelete`: API 요청 계약 담당
- Pinia: 인증·앱 전역 상태만 담당
- 페이지별 `useSetMeta`: 제목과 메타 URL 설정

### 4.2 서버

- `server/api/`: HTTP 엔드포인트
- `server/services/`: 권한·검증·트랜잭션이 포함된 도메인 서비스
- `server/repositories/`: Drizzle 조회·저장 조합
- `server/utils/`: JWT, 비밀번호, API 오류, 공통 응답 처리
- `server/db/schema/postgresql/`: 개발·운영이 공유하는 PostgreSQL Drizzle 스키마

라우트 핸들러는 입력을 검증하고 서비스에 위임한다. 서비스는 현재 관리자, 프로젝트 범위, 데이터 상태, 행 간 제약을 검증한 뒤 저장소를 호출한다.

공통 API 응답은 `server/utils/createResponse.ts`의 `CreateResponse`로 생성한다.

### 4.3 인증

- 이메일 로그인
- JWT access token
- refresh token
- 임시 비밀번호 변경 의무
- 비밀번호 변경 전 일반 기능 사용 차단
- 로그아웃 시 refresh token 폐기

## 5. 공통 API 계약

### 5.1 성공 응답

단건 응답은 다음 형태를 사용한다.

```ts
{
  error: false,
  data: T,
  code: 'OK',
  message: '요청이 정상적으로 처리되었습니다.',
}
```

목록 응답은 다음 형태를 사용한다.

```ts
{
  error: false,
  data: {
    list: T[],
    page: 0,
    pageSize: 20,
    totalElements: 0,
    numberOfElements: 0,
    startIndex: 0,
    endIndex: 0,
    hasPrev: false,
    hasNext: false,
    isFirst: true,
    isLast: true,
    empty: true,
    totalPages: 0,
  },
  code: 'OK',
  message: '요청이 정상적으로 처리되었습니다.',
}
```

### 5.2 오류 응답

```ts
{
  error: true,
  data: null,
  code: 'INTERNAL_SERVER_ERROR',
  message: '서버 내부 오류가 발생했습니다.',
}
```

주요 오류 코드는 `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INVALID_INPUT`, `DUPLICATE_NAME`, `CONFLICT`, `INTERNAL_ERROR`로 통일한다.

### 5.3 공통 조회 조건

목록 API는 기본적으로 `useYn = 'Y'`, `delYn = 'N'`인 데이터만 반환한다. 휴지통 API만 삭제 데이터를 명시적으로 조회한다.

모든 프로젝트·월드 하위 API는 경로의 상위 ID가 실제 부모 관계와 일치하는지 확인한다.

## 6. 단계별 구현 순서

## 6.0 공통 기반

### 목표

이후 모든 기능이 재사용할 인증, API, DB, 오류, 레이아웃 기반을 완성한다.

### 구현 대상

- DB 연결 생성과 환경별 설정
- PostgreSQL 생성·마이그레이션 검증
- API 공통 응답·오류 유틸리티
- 요청 입력 검증 방식
- 인증 토큰 저장 방식
- 인증 상태 Pinia store
- 인증 페이지 미들웨어
- 실제 `AppSidebar`를 기본 레이아웃에 연결
- 로딩·오류·빈 상태 공통 컴포넌트

### 완료 기준

- `/api/health`가 정상 응답한다.
- 보호 페이지 접근 시 인증 여부에 따라 이동한다.
- API 오류가 하나의 형식으로 반환된다.
- PostgreSQL 스키마 생성·마이그레이션을 검증할 수 있다.
- 전체 테스트와 타입 검사의 실행 명령이 고정된다.

## 6.1 인증과 계정

### 화면

```text
/signin
/account
/account/password-change
```

### API

```text
POST /api/auth/signin
POST /api/auth/refresh
POST /api/auth/signout
GET  /api/auth/me
POST /api/auth/password
```

### 흐름

```text
signin 화면
→ 이메일·비밀번호 제출
→ 관리자 계정 조회
→ 비밀번호 검증
→ access token·refresh token 발급
→ passwordChangeRequiredYn 확인
→ 변경 필요 시 password-change 화면으로 강제 이동
→ 변경 완료 후 보호 영역 진입
```

### 주요 검증

- 존재하지 않는 이메일과 잘못된 비밀번호를 동일한 인증 실패로 처리한다.
- 비활성·삭제 계정은 로그인할 수 없다.
- 임시 비밀번호 상태에서는 계정·비밀번호 변경 외의 페이지를 차단한다.
- refresh token은 해시 저장하고 폐기 여부와 만료일을 확인한다.
- 비밀번호 변경 성공 시 `passwordChangeRequiredYn`을 `N`으로 변경한다.

### 구현 기록 (2026-08-15)

- access token은 15분짜리 HttpOnly JWT 쿠키, refresh token은 14일짜리 HttpOnly 무작위 값 쿠키로 구현했다. DB에는 refresh token의 SHA-256 해시만 저장한다.
- refresh와 비밀번호 변경 성공 시 access·refresh 쿠키를 함께 새로 발급한다.
- `/signin`과 `/account/password-change`는 사이드바가 없는 `auth` 레이아웃을 사용하며, `/account`는 기본 레이아웃을 유지한다.
- 역할·프로젝트 범위 권한 계산은 다음 단계인 관리자·권한에서 실제 관리 기능과 함께 구현한다.

## 6.2 관리자 계정과 권한

### 화면

```text
/admin
/admins
/admins/new
/admins/:adminId
/admins/:adminId/edit
/admins/:adminId/permissions
/admin/permissions
/projects/:projectId/admins
```

### API

```text
GET    /api/admins
POST   /api/admins
GET    /api/admins/:adminId
PATCH  /api/admins/:adminId
DELETE /api/admins/:adminId

GET    /api/admins/:adminId/permissions
PATCH  /api/admins/:adminId/permissions
GET    /api/permissions

GET    /api/projects/:projectId/admins
POST   /api/projects/:projectId/admins
PATCH  /api/projects/:projectId/admins/:adminId
DELETE /api/projects/:projectId/admins/:adminId
```

### UI 구성

- 관리자 목록: 이메일, 이름, 역할, 활성 상태, 마지막 로그인
- 관리자 생성: 이메일, 이름, 역할 입력
- 관리자 상세: 계정 정보, 프로젝트 배정, 권한 요약
- 관리자 수정: 이름, 역할, 활성 상태
- 권한 설정: 18개 권한을 그룹별로 표시하고 `Y/N` 설정
- 프로젝트 관리자: 서브 어드민 초대, 재초대, 비활성화, 배정 해제

### 권한 범위

`SUPER_ADMIN`만 전역 관리자와 권한 마스터를 관리한다. `ADMIN`은 본인 프로젝트의 서브 어드민만 관리한다. `SUB_ADMIN`에게 관리자 페이지와 권한 설정 페이지를 노출하지 않는다.

## 6.3 프로젝트

### 화면

```text
/projects
/projects/new
/projects/:projectId
/projects/:projectId/settings
```

### API

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:projectId
PATCH  /api/projects/:projectId
DELETE /api/projects/:projectId
```

### 구현 순서

1. 프로젝트 목록 테이블
2. 프로젝트 생성 폼
3. 프로젝트 상세 대시보드
4. 프로젝트 수정·삭제
5. 프로젝트 접근 권한 처리

프로젝트 대시보드는 월드 목록, 최근 문서, 문서 수, 관계 수를 우선 표시한다. 실제 통계 API가 준비되기 전에는 임의의 더미 수치를 사용하지 않는다.

## 6.4 월드

### 화면

```text
/projects/:projectId/worlds
/projects/:projectId/worlds/new
/projects/:projectId/worlds/:worldId
/projects/:projectId/worlds/:worldId/settings
```

### API

```text
GET    /api/projects/:projectId/worlds
POST   /api/projects/:projectId/worlds
GET    /api/worlds/:worldId
PATCH  /api/worlds/:worldId
DELETE /api/worlds/:worldId
```

월드는 프로젝트의 하위 관리 공간이다. 프로젝트 소유자와 배정된 관리자만 접근할 수 있으며, 월드 삭제 중에도 하위 카테고리·템플릿·문서의 `delYn`은 유지한다.

## 6.5 카테고리

### 화면

```text
/projects/:projectId/worlds/:worldId/categories
/projects/:projectId/worlds/:worldId/categories/new
/projects/:projectId/worlds/:worldId/categories/:categoryId
/projects/:projectId/worlds/:worldId/categories/:categoryId/documents
/projects/:projectId/worlds/:worldId/categories/:categoryId/templates
```

### API

```text
GET    /api/worlds/:worldId/categories
POST   /api/worlds/:worldId/categories
GET    /api/categories/:categoryId
PATCH  /api/categories/:categoryId
DELETE /api/categories/:categoryId
PATCH  /api/categories/:categoryId/order
```

### 검증

- 카테고리 단계는 1~3단계로 제한한다.
- 상위 카테고리는 같은 월드에 속해야 한다.
- 최상위 카테고리에만 템플릿을 연결한다.
- 삭제된 동일 이름 데이터가 있으면 기존 데이터를 복구한다.
- 하위 카테고리의 접근은 상위 삭제 상태를 반영해 차단한다.

## 6.6 템플릿과 섹션

### 화면

```text
/projects/:projectId/worlds/:worldId/templates
/projects/:projectId/worlds/:worldId/templates/new
/projects/:projectId/worlds/:worldId/templates/:templateId
/projects/:projectId/worlds/:worldId/templates/:templateId/edit
/projects/:projectId/worlds/:worldId/templates/:templateId/categories
/projects/:projectId/worlds/:worldId/templates/:templateId/documents
```

### API

```text
GET    /api/worlds/:worldId/templates
POST   /api/worlds/:worldId/templates
GET    /api/templates/:templateId
PATCH  /api/templates/:templateId
DELETE /api/templates/:templateId

GET    /api/templates/:templateId/sections
POST   /api/templates/:templateId/sections
PATCH  /api/template-sections/:templateSectionId
DELETE /api/template-sections/:templateSectionId
```

### UI 흐름

```text
템플릿 기본 정보 저장
→ 섹션 트리 구성
→ 섹션 순서·상위 섹션 설정
→ 필수 여부 설정
→ 카테고리 매핑
→ 사용 문서 확인
```

템플릿 변경 시 버전을 증가시키고, 기존 문서에는 구버전 템플릿 경고를 표시한다. 삭제된 템플릿 섹션은 문서에서 삭제된 섹션으로 표시한다.

## 6.7 설정 문서

### 화면

```text
/projects/:projectId/worlds/:worldId/documents
/projects/:projectId/worlds/:worldId/documents/new
/projects/:projectId/worlds/:worldId/documents/:documentId
/projects/:projectId/worlds/:worldId/documents/:documentId/edit
```

### API

```text
GET    /api/worlds/:worldId/documents
POST   /api/worlds/:worldId/documents
GET    /api/documents/:documentId
PATCH  /api/documents/:documentId
DELETE /api/documents/:documentId

GET    /api/documents/:documentId/categories
PATCH  /api/documents/:documentId/categories
GET    /api/documents/:documentId/sections
PATCH  /api/documents/:documentId/sections
```

### 문서 편집 흐름

```text
문서 로드
→ 템플릿 정보 확인
→ Markdown 본문을 #·##·### 기준으로 섹션에 배치
→ 템플릿 섹션과 문서 전용 섹션 구분
→ 사용자 편집
→ 저장 버튼 클릭
→ 섹션을 Markdown 문자열로 재결합
→ documents.content 저장
```

자동 저장은 사용하지 않는다. 저장 버튼을 클릭했을 때만 API를 호출한다. 문서 본문의 영구 정본은 `documents.content` 하나이며 섹션별 별도 본문 컬럼은 만들지 않는다.

## 6.8 관계 타입과 문서 관계

### 화면

```text
/projects/:projectId/worlds/:worldId/relation-types
/projects/:projectId/worlds/:worldId/relation-types/new
/projects/:projectId/worlds/:worldId/relation-types/:relationTypeId
/projects/:projectId/worlds/:worldId/relation-types/:relationTypeId/edit
/projects/:projectId/worlds/:worldId/relations
/projects/:projectId/worlds/:worldId/documents/:documentId/relations
```

### API

```text
GET    /api/worlds/:worldId/relation-types
POST   /api/worlds/:worldId/relation-types
GET    /api/relation-types/:relationTypeId
PATCH  /api/relation-types/:relationTypeId
DELETE /api/relation-types/:relationTypeId

GET    /api/worlds/:worldId/relationships
POST   /api/worlds/:worldId/relationships
GET    /api/relationships/:relationshipId
PATCH  /api/relationships/:relationshipId
DELETE /api/relationships/:relationshipId
```

관계는 관계 타입, 역할, 허용 카테고리, 실제 문서 대상의 순서로 구성한다. 실제 관계 저장 시 같은 월드, 역할 호환성, 대상 수, 필수 역할을 하나의 트랜잭션에서 확인한다.

## 6.9 관계 기반 표현

### 화면

```text
/projects/:projectId/relations
/projects/:projectId/timeline
/projects/:projectId/worlds/:worldId/relations
/projects/:projectId/worlds/:worldId/timeline
/projects/:projectId/worlds/:worldId/documents/:documentId/relations
/projects/:projectId/worlds/:worldId/documents/:documentId/family-tree
/projects/:projectId/worlds/:worldId/documents/:documentId/timeline
```

### API

```text
GET /api/projects/:projectId/relationships
GET /api/projects/:projectId/timeline
GET /api/worlds/:worldId/relationship-graph
GET /api/worlds/:worldId/timeline
GET /api/documents/:documentId/relationship-graph
GET /api/documents/:documentId/family-tree
GET /api/documents/:documentId/timeline
```

연표와 가계도는 별도 데이터를 저장하지 않는다. 문서와 관계를 조회해 화면용 구조로 변환한다.

## 6.10 검색·최근·즐겨찾기·휴지통·활동

핵심 CRUD가 안정된 뒤 파생 조회 기능을 구현한다.

```text
/projects/:projectId/search
/projects/:projectId/recent
/projects/:projectId/favorites
/projects/:projectId/activity
/projects/:projectId/trash
/projects/:projectId/worlds/:worldId/search
/projects/:projectId/worlds/:worldId/recent
/projects/:projectId/worlds/:worldId/favorites
/projects/:projectId/worlds/:worldId/activity
/projects/:projectId/worlds/:worldId/trash
```

이 단계에서 문서 제목·본문·카테고리·템플릿·관계 검색을 제공한다. 최근 열람과 즐겨찾기를 별도 테이블로 저장할지, 관리자별 사용자 상태 테이블을 추가할지는 구현 전 확정한다.

## 7. 단계 간 의존성

```text
공통 기반
   ↓
인증·계정
   ↓
관리자·권한
   ↓
프로젝트
   ↓
월드
   ↓
카테고리
   ↓
템플릿·섹션
   ↓
설정 문서
   ↓
관계 타입·문서 관계
   ↓
연표·가계도·관계 표현
   ↓
검색·최근·즐겨찾기·활동·휴지통
```

프로젝트와 월드는 모든 하위 데이터의 접근 범위를 결정한다. 카테고리와 템플릿은 문서 입력 구조를 결정한다. 문서는 관계의 대상이 되므로 관계 기능보다 먼저 완성한다.

## 8. UI 구현 규칙

### 목록 화면

- 페이지 제목과 설명
- 생성 버튼
- 검색·필터 영역
- 데이터 테이블
- 로딩 상태
- 빈 상태
- 오류 상태
- 행 단위 상세·수정·삭제 액션

### 폼 화면

- 생성과 수정의 입력 계약을 분리한다.
- 서버 검증 오류를 필드별로 표시한다.
- 저장 중에는 중복 제출을 차단한다.
- 저장 성공 후 상세 또는 목록으로 이동한다.
- 삭제는 확인 절차를 거친다.

### 상세 화면

- 기본 정보
- 상태와 권한
- 연결된 하위 데이터
- 관련 데이터로 이동하는 링크
- 수정·삭제 액션

### 권한 처리

권한 없는 버튼을 단순히 비활성화하는 것만으로 끝내지 않는다. 페이지 접근, API 호출, 직접 URL 접근을 모두 차단한다.

## 9. 테스트 전략

### 단위 테스트

- API 입력 검증
- 권한 계산
- JWT 처리
- 비밀번호 변경 조건
- 상위 삭제 접근 차단
- 동일 이름 데이터 복구
- 카테고리 3단계 제한
- 관계 대상 수와 역할 검증

### API 테스트

- 정상 CRUD
- 인증 실패
- 권한 부족
- 다른 프로젝트 접근 차단
- 소프트 삭제·복구
- 중복 이름
- 잘못된 상위 ID

### 페이지 테스트

- 페이지 파일 존재
- `useSetMeta` 호출
- 로딩·빈 상태·오류 상태 렌더링
- 저장·삭제 버튼의 API 호출
- 권한별 UI 노출

### 통합 검증

각 단계 완료 시 다음을 실행한다.

```text
pnpm test
pnpm lint
pnpm exec vue-tsc --noEmit
pnpm build
```

DB 스키마나 마이그레이션 변경이 있는 단계에서는 PostgreSQL Drizzle 생성·적용과 구조 검사를 추가한다.

## 10. 커밋 단위

기능 단계마다 하나의 의미 있는 커밋을 남긴다.

```text
2026 0815 feat: 인증 기반 추가
2026 0815 feat: 관리자 계정 관리 추가
2026 0815 feat: 관리자 권한 설정 추가
2026 0815 feat: 프로젝트 관리 추가
2026 0815 feat: 월드 관리 추가
2026 0815 feat: 카테고리 관리 추가
2026 0815 feat: 템플릿 관리 추가
2026 0815 feat: 설정 문서 관리 추가
2026 0815 feat: 문서 관계 관리 추가
```

한 커밋 안에 UI, API, 테스트가 함께 들어가야 한다. 완료되지 않은 기능을 화면만 먼저 커밋하지 않는다.

## 11. 첫 작업 확정안

첫 번째 구현 작업은 인증 수직 슬라이스로 확정한다.

```text
app/pages/signin.vue UI 완성
app/pages/account/password-change.vue UI 완성
app/pages/account.vue UI 완성
POST /api/auth/signin
POST /api/auth/refresh
POST /api/auth/signout
GET  /api/auth/me
POST /api/auth/password
인증 store·middleware
인증 API 테스트
인증 페이지 테스트
```

이 작업이 완료되면 동일한 구조로 관리자 계정과 권한 설정을 진행한다. 이후 프로젝트·월드·카테고리·템플릿·문서·관계 순서로 기능을 확장한다.

## 12. 보류 항목

다음 기능은 현재 작업 순서에서 제외한다.

- 문서 리비전
- 변경 비교
- 롤백
- 문서 토론
- 일반 사용자 공개 뷰어
- 실시간 공동 편집
- 복잡한 감사 로그 화면

단, 모든 저장 데이터의 생성자·수정자·삭제자 추적은 현재 DB 설계에 포함되므로 API 저장 계층에서 반드시 처리한다.
