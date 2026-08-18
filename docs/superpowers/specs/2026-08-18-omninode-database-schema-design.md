# 옴니노드 데이터베이스 스키마 설계

## 목적

`references/옴니노드 데이터베이스 명세서.md`의 20개 엔터티를 PostgreSQL Drizzle 스키마로 선언한다. 이 작업은 테이블 선언과 제약 정의만 다루며, 마이그레이션 생성·DB 적용·API·CRUD 쿼리는 포함하지 않는다.

## 범위와 파일 구조

`server/db/table/`에 테이블별 `<domain>.table.ts` 파일을 둔다. `server/db/table/index.ts`는 named export만 재노출하며, `drizzle.dev.config.ts`와 `drizzle.prod.config.ts`는 이 파일을 schema 진입점으로 사용한다.

대상 테이블은 다음 20개다.

- `admins`, `admin_requests`, `world_admins`, `project_admin_permissions`
- `worlds`, `projects`
- `categories`, `project_categories`
- `templates`, `template_headings`, `project_templates`
- `documents`, `document_revisions`
- `relationship_types`, `relationship_roles`, `relationship_role_categories`
- `world_relationship_types`, `world_relationship_role_categories`
- `relationships`, `relationship_targets`

## 명명 및 타입

- Drizzle export와 속성은 `camelCase`로 작성한다.
- PostgreSQL의 테이블·컬럼·인덱스 식별자는 `snake_case`로 명시한다.
- 기본키는 `bigserial`의 number mode, 외래키는 `bigint`의 number mode를 사용한다.
- 날짜는 `timestamp` with timezone으로 선언한다.
- `use_yn`, `del_yn` 및 개별 Y/N 상태는 `char(1)`와 CHECK 제약으로 제한한다.
- 역할·요청 상태·관계 방향·카테고리 및 역할 범위는 `varchar`와 CHECK 제약으로 제한한다.

## 공통 컬럼 및 기본값

모든 테이블은 `id`, `use_yn`, `del_yn`, `create_id`, `create_date`, `update_id`, `update_date`, `delete_id`, `delete_date`를 가진다. 상태 기본값은 `use_yn = 'Y'`, `del_yn = 'N'`이고, `create_date`는 기본값으로 현재 UTC 시각을 기록한다. 감사 관리자 FK는 모두 nullable이며 `admins.id`를 참조한다.

## 제약 구현

각 명세의 PK·FK·Y/N CHECK·열거값 CHECK·복합 UNIQUE를 Drizzle 선언으로 구현한다. `projects(world_id, name)`와 `documents(project_id, title)`의 활성 데이터 중복 제한은 `del_yn = 'N'` 조건의 부분 UNIQUE 인덱스로 선언한다. 활성 PENDING `admin_requests`와 현재 `document_revisions`도 같은 방식으로 중복을 최대 한 건으로 제한한다.

## 서비스 계층 검증으로 남기는 규칙

다음 규칙은 단일 테이블 제약만으로 완전하게 보장할 수 없으므로, 후속 서비스 트랜잭션 검증의 책임으로 남긴다.

- SUPER_ADMIN 정확히 한 명, 월드별 ADMIN 정확히 한 명
- 카테고리 깊이와 부모의 깊이·월드 일치
- 프로젝트와 카테고리·템플릿·권한 부여 대상의 월드 일치
- 문서의 카테고리 계층과 프로젝트 사용 가능 상태
- 기본/사용자 정의 관계의 월드 사용 조건, 역할·대상 문서의 관계 유형·월드·카테고리 일치
- 관계의 필수 역할 충족과 2~4개 대상 수
- 문서별 현재 리비전 정확히 한 건 보장

## 검증 기준

- 20개 테이블이 배럴에서 export된다.
- 모든 물리 식별자가 snake_case이고 TS 속성이 camelCase다.
- 명세의 FK, CHECK, UNIQUE, 부분 UNIQUE가 Drizzle 메타데이터에 반영된다.
- `vue-tsc`, 대상 ESLint, 스키마 구조 테스트 및 `git diff --check`를 실행한다.
