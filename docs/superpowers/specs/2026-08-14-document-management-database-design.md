# 문서 관리 시스템 데이터베이스 설계

## 1. 목적과 범위

첨부된 「문서 관리 시스템 데이터베이스 명세서」를 Omninode의 Drizzle ORM 스키마로 구현한다. 초기 범위는 관리자 인증, 프로젝트·월드, 3단계 카테고리, 템플릿·섹션, Markdown 문서, 관계 유형과 실제 문서 관계의 18개 테이블이다.

문서 리비전, 일반 사용자, 토론·댓글, 문서 전용 섹션의 템플릿 승격은 포함하지 않는다.

## 2. 구현 방식

권장안은 PostgreSQL 단일 Drizzle 스키마를 개발·운영 데이터베이스에 함께 사용하는 방식이다.

| 환경 | 파일 | DBMS | 목적 |
| --- | --- | --- | --- |
| 개발 | `server/db/schema/postgresql/<tableName>.table.ts` | PostgreSQL (`omninode`) | 개발 데이터 저장 |
| 운영 | `server/db/schema/postgresql/<tableName>.table.ts` | PostgreSQL (`omninode_prod`) | 운영 데이터 저장 |

스키마는 테이블별 `<tableName>.table.ts` 파일로 분리하고, `index.ts`는 named export만 다시 내보낸다. Drizzle TypeScript 테이블 export와 속성 key는 camelCase로, DB 물리 테이블·컬럼명은 snake_case로 선언한다.

### 2.1 공통 컬럼

모든 테이블에 아래 컬럼을 둔다.

| 컬럼 | PostgreSQL | 제약 |
| --- | --- | --- |
| `id` | `bigserial` PK | 모든 테이블에 존재 |
| `useYn` | `char(1)` | `Y` 또는 `N`, 기본 `Y` |
| `delYn` | `char(1)` | `Y` 또는 `N`, 기본 `N` |
| `createDate` | 현재 시각 | NOT NULL |
| `updateDate` | 현재 시각 | NOT NULL |
| `deleteDate` | 날짜·시각 | NULL 허용 |

`updateDate`의 자동 갱신은 DB 트리거로 넣지 않는다. 이후 저장 서비스가 명시적으로 갱신하며, Drizzle의 `$onUpdate`는 애플리케이션 경로의 편의를 위한 보조 수단으로만 사용한다.

### 2.2 삭제와 외래키

모든 외래키는 `ON DELETE NO ACTION`으로 선언한다. 물리 삭제와 연쇄 삭제는 사용하지 않으며, 소프트 삭제는 `delYn = 'Y'` 및 `deleteDate` 설정으로 처리한다. 상위 데이터의 삭제·복구에 따른 하위 데이터 접근 차단·복구는 조회와 권한 서비스의 책임이다.

## 3. 테이블 모델

### 3.1 관리자·인증

| 테이블 | 핵심 컬럼 | 관계와 데이터베이스 제약 |
| --- | --- | --- |
| `admins` | `email`, `passwordHash`, `name`, `role`, `createdByAdminId`, `passwordChangeRequiredYn`, `lastLoginDate` | `email` 전역 UNIQUE, 생성자 자기참조 FK, `role`과 YN CHECK |
| `adminRefreshTokens` | `adminId`, `tokenHash`, `expiresDate`, `revokedYn`, `revokedDate`, `deviceInfo` | `tokenHash` UNIQUE, 관리자 FK, 만료·상태 인덱스 |
| `projectAdmins` | `projectId`, `adminId` | `(projectId, adminId)` UNIQUE, 프로젝트·관리자 FK |

`SUPER_ADMIN` 한 명 제한, 계정 생성자와 역할의 조합, 서브 어드민의 프로젝트 소유자 일치는 다른 행을 조회해야 하므로 서비스 트랜잭션에서 검증한다.

### 3.2 프로젝트·월드·카테고리

| 테이블 | 핵심 컬럼 | 관계와 데이터베이스 제약 |
| --- | --- | --- |
| `projects` | `adminId`, `name`, `description` | `(adminId, name)` UNIQUE, 소유 관리자 FK |
| `worlds` | `projectId`, `name`, `description` | `(projectId, name)` UNIQUE, 프로젝트 FK |
| `categories` | `worldId`, `upperCategoryId`, `templateId`, `name`, `level`, `order` | 월드·상위 카테고리·템플릿 FK, `level` 1~3 CHECK, `(worldId, COALESCE(upperCategoryId, 0), name)` UNIQUE |

`categories.templateId`와 `templates`의 상호 참조는 순환 외래키가 된다. 테이블 선언은 가능하지만 마이그레이션에서는 `categories` 생성 후 `templates`, 이후 `categories.templateId` FK를 추가해야 한다.

상위 카테고리의 월드·레벨 일치, 1단계에만 템플릿 허용, 최대 3단계 보장은 서비스에서 검증한다.

### 3.3 템플릿·섹션·문서

| 테이블 | 핵심 컬럼 | 관계와 데이터베이스 제약 |
| --- | --- | --- |
| `templates` | `worldId`, `name`, `description`, `version` | `(worldId, name)` UNIQUE, `version >= 1` CHECK |
| `sections` | `title`, `level`, `sectionType`, `createdByAdminId` | 관리자 FK, `level` 1~6 및 `sectionType` CHECK |
| `templateSections` | `templateId`, `sectionId`, `upperSectionId`, `order`, `requiredYn` | `(templateId, sectionId)` UNIQUE, 템플릿·섹션 FK |
| `documents` | `worldId`, `templateId`, `templateVersion`, `title`, `content` | `(worldId, title)` UNIQUE, 월드·템플릿 FK |
| `documentCategories` | `documentId`, `categoryId`, `level` | `(documentId, level)`, `(documentId, categoryId)` UNIQUE, 문서·카테고리 FK |
| `documentSections` | `documentId`, `sectionId`, `upperSectionId`, `order`, `templateSectionYn`, `appliedTemplateVersion` | `(documentId, sectionId)` UNIQUE, 문서·섹션 FK |

문서 본문의 영구 정본은 `documents.content` 하나다. 섹션별 콘텐츠 컬럼은 만들지 않는다. 제목·본문 GIN 전문 검색 인덱스는 PostgreSQL 마이그레이션으로 관리한다.

템플릿·문서와 카테고리·섹션의 월드 일치, 트리의 부모·자식 일치, 문서의 정확히 하나인 1단계 카테고리는 서비스 트랜잭션에서 검증한다.

### 3.4 관계 유형과 월드 설정

| 테이블 | 핵심 컬럼 | 관계와 데이터베이스 제약 |
| --- | --- | --- |
| `relationshipTypes` | `ownerAdminId`, `name`, `description`, `systemYn`, `minTargetCount`, `maxTargetCount` | 관리자 FK, 대상 수 CHECK, 시스템·소유자 조합 CHECK, 시스템/소유자별 이름 UNIQUE |
| `relationshipTypeRoles` | `relationshipTypeId`, `name`, `displayName`, `roleOrder`, `requiredYn` | `(relationshipTypeId, roleOrder)`, `(relationshipTypeId, name)` UNIQUE |
| `worldRelationshipTypes` | `worldId`, `relationshipTypeId` | `(worldId, relationshipTypeId)` UNIQUE |
| `worldRelationshipRoleCategories` | `worldRelationshipTypeId`, `relationshipTypeRoleId`, `categoryId` | 세 컬럼 UNIQUE, 월드 관계·역할·카테고리 FK |

시스템 관계명과 사용자 관계명의 범위를 그대로 나눈 PostgreSQL 부분 UNIQUE 인덱스를 사용한다. 관계 역할이 해당 관계 유형에 속하는지, 카테고리가 같은 월드인지, 최소 대상 수를 충족하는지는 서비스 검증 대상이다.

### 3.5 실제 문서 관계

| 테이블 | 핵심 컬럼 | 관계와 데이터베이스 제약 |
| --- | --- | --- |
| `documentRelationships` | `worldId`, `worldRelationshipTypeId`, `createdByAdminId`, `description` | 월드·월드 관계 설정·생성자 FK |
| `documentRelationshipTargets` | `documentRelationshipId`, `relationshipTypeRoleId`, `documentId` | `(documentRelationshipId, relationshipTypeRoleId)` 및 `(documentRelationshipId, documentId)` UNIQUE, 관계·역할·문서 FK |

같은 월드의 문서만 배정, 역할 유형·카테고리 조건, 필수 역할 및 대상 수 범위는 한 행의 FK로 표현할 수 없으므로 관계 생성·수정 서비스에서 하나의 트랜잭션으로 검증한다.

## 4. 인덱스와 제약 적용 원칙

초안에 명시된 UNIQUE·상태·검색·트리·정렬 인덱스를 구현한다. 다음 규칙을 적용한다.

- 모든 YN 컬럼은 `Y`, `N` CHECK를 둔다.
- `role`, `sectionType`, 카테고리·섹션의 `level`, 템플릿 버전, 관계 대상 수는 해당 허용 범위 CHECK를 둔다.
- 이름의 범위별 고유성은 소프트 삭제 데이터도 포함한다. 따라서 동일 이름 재생성은 새 행 대신 기존 행 복구로 처리한다.
- 상태 조회가 많은 테이블에는 초안의 `(범위 FK, useYn, delYn)` 복합 인덱스를 둔다.
- 검증 규칙을 DB 제약으로 가장해 우회하지 않는다. 여러 테이블을 함께 확인해야 하는 규칙은 반드시 서버 저장 API에서 검사한다.

## 5. 마이그레이션과 검증 계획

승인 후 다음 순서로 구현한다.

1. 테이블 존재·핵심 컬럼·기본값·인덱스를 검증하는 스키마 구조 테스트를 먼저 작성한다.
2. PostgreSQL Drizzle 스키마를 개발·운영 환경에 공통으로 선언한다.
3. 공통 PostgreSQL 마이그레이션을 생성하고, 순환 FK와 GIN 전문 검색 SQL을 분리한다.
4. PostgreSQL 스키마 생성 명령과 구조 테스트를 실행한다.
5. 타입 검사와 빌드를 실행하고, 기존 무관한 실패가 있으면 분리해 보고한다.

데이터베이스를 실제로 생성하거나 운영 DB에 적용하는 작업은 이 설계에 포함하지 않는다. 승인된 구현 계획에서 생성 대상과 실행 범위를 다시 확인한다.

## 6. 완료 기준

- 18개 테이블이 PostgreSQL Drizzle 스키마에 존재한다.
- 모든 공통 컬럼, 명시된 FK·UNIQUE·CHECK·일반 인덱스가 구현된다.
- 표현식·부분·전문 검색 인덱스는 PostgreSQL 마이그레이션으로 검증된다.
- 교차 테이블·권한·소프트 삭제 복구 규칙은 향후 서버 서비스의 검증 책임으로 명확히 분리된다.
- 스키마 구조 테스트, Drizzle 생성, 타입 검사와 빌드 결과가 기록된다.
