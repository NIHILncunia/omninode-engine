# Omninode 개발 진행 대장

> 이 파일은 현재 `nihil-work` 브랜치의 개발 진척도를 추적하는 단일 기준이다.
> 최신 설계 기준은 `references/옴니노드 데이터베이스 명세서.md`와 `references/옴니노드 API 명세서.md`를 따른다.

## 운영 규칙

- `[x]`는 실제 구현 또는 문서 반영이 완료된 항목에만 사용한다.
- `[ ]`는 아직 시작하지 않았거나 완료되지 않은 항목이다.
- 현재 설계와 충돌하는 과거 구조는 진행 대장에서 제거한다.
- 기능 단계는 DB, API, 권한, UI가 필요한 범위까지 함께 본다.
- 완료되지 않은 작업을 추정으로 완료 처리하지 않는다.
- 단계가 끝나면 완료 범위와 다음 시작 지점을 이 파일에 갱신한다.

---

# 1. 현재 확정 구조

## 계층

```text
System
├─ 기본 Category
├─ 기본 Template
└─ 기본 Relationship Type

World
├─ Admin
├─ Project
├─ 사용자 정의 Relationship Type
└─ Relationship

Project
├─ 사용자 정의 Category
├─ 사용자 정의 Template
└─ Document
```

## 관리자

```text
SUPER_ADMIN
ADMIN
SUB_ADMIN
```

- SUPER_ADMIN은 시스템 전체 접근.
- ADMIN은 SUPER_ADMIN 승인 후 생성되며 World 없이 존재 가능.
- ADMIN은 직접 World를 생성할 수 있다.
- SUB_ADMIN은 World에 소속되고 Project별 `project_admin_permissions`로 접근과 권한을 관리한다.
- 활성 `project_admin_permissions`가 없으면 SUB_ADMIN은 해당 Project를 열람할 수 없다.

## Category

- 기본 Category는 시스템 전역.
- 사용자 정의 Category는 Project 종속.
- 사용자 정의 Category의 Project 소속은 `project_categories`로 관리.
- 기본 Category는 `project_categories`에 넣지 않는다.
- Category는 최대 3단계.
- 생성 후 `parentId`, `depth` 변경 불가.

## Template

- 기본 Template은 시스템 전역.
- 사용자 정의 Template은 Project 종속.
- Project 소속 및 Category 적용은 `project_templates`로 관리.
- `project_templates.categoryId`는 NULL 가능.
- Template은 Category에 할당되지 않은 상태에서도 존재 가능.

## Document

- Document는 Project 종속.
- 본문은 `documents`가 아니라 `document_revisions.content`에 저장.
- 현재 Revision은 `currentYn=Y`로 관리.
- Document `title`은 생성 후 변경 불가.

## Relationship

- 기본 Relationship Type은 시스템 전역.
- 사용자 정의 Relationship Type은 World 종속.
- 실제 Relationship도 World 종속.
- 같은 World에 속한 서로 다른 Project의 Document끼리 연결 가능.
- 실제 Relationship의 `relationshipTypeId`는 생성 후 변경 불가.

## 삭제 / 복구

- 삭제는 소프트 삭제.
- 동일명 생성 요청에서 삭제된 메인 데이터가 있으면 기존 메인 row를 재사용.
- 메인 row만 복구하고 과거 연관 데이터는 전부 `useYn=N`, `delYn=Y` 처리.
- 연관 데이터는 새 row로 다시 생성.
- 재생성 가능한 연관 테이블의 UNIQUE는 활성 row(`delYn='N'`) 기준 조건부 UNIQUE 사용.

## API 응답

- HTTP Status는 애플리케이션 응답에서 항상 `200`.
- 실제 성공/실패는 `BaseResponse.error`로 구분.
- `code`는 숫자가 아니라 `responseCodeData`의 문자열 코드 사용.

예:

```json
{
  "data": null,
  "error": true,
  "code": "NOT_FOUND",
  "message": "요청한 리소스를 찾을 수 없습니다."
}
```

---

# 2. 전체 진행 상태

| 상태 | 단계 | 핵심 결과 |
| --- | --- | --- |
| 완료 | 0. 도메인 재설계 | World / Project / Category / Template / Document / Relationship 구조 확정 |
| 완료 | 1. DB 명세 | 최신 20개 테이블 DB 명세 작성 |
| 완료 | 2. API 명세 | HTTP 200 고정 및 문자열 ResponseCode 포함 API 계약 작성 |
| 완료 | 3. Drizzle 스키마 정합화 | 최신 DB 명세에 맞춰 주요 테이블 및 조건부 UNIQUE 수정 |
| 진행 전 | 4. 서버 공통 기반 | DB client, 공통 응답, 오류 처리, 인증 공통 유틸 |
| 진행 전 | 5. 인증 / 관리자 | Auth, ADMIN 신청, Admin, SUB_ADMIN, Project Permission API |
| 진행 전 | 6. World / Project | World와 Project CRUD 및 접근 범위 |
| 진행 전 | 7. Category / Template | Category 트리, Template, Project 매핑 |
| 진행 전 | 8. Document / Revision | Document CRUD, Revision 생성/복원 |
| 진행 전 | 9. Relationship | Relationship Type, Role, World 설정, 실제 Relationship |
| 진행 전 | 10. UI 연동 | Vue Query / Pinia / 관리 화면 연결 |
| 진행 전 | 11. 통합 정합성 검토 | DB / API / UI / 권한 / 문서 최종 정합성 점검 |

---

# 3. 완료 — 도메인 재설계

- [x] World를 상위 범위로 확정
- [x] Project를 World 종속으로 확정
- [x] 사용자 정의 Category를 Project 종속으로 확정
- [x] 사용자 정의 Template을 Project 종속으로 확정
- [x] 사용자 정의 Relationship Type을 World 종속으로 확정
- [x] 실제 Relationship을 World 종속으로 확정
- [x] 같은 World의 다른 Project 문서 간 Relationship 허용
- [x] ADMIN은 World 없이 존재 가능하도록 확정
- [x] ADMIN이 직접 World를 생성하도록 확정
- [x] SUB_ADMIN Project 접근을 `project_admin_permissions` 존재 여부로 제어하도록 확정

---

# 4. 완료 — DB 명세

기준 문서:

```text
references/옴니노드 데이터베이스 명세서.md
```

- [x] 20개 테이블 구조 정리
- [x] 공통 감사 컬럼 정리
- [x] 동일명 생성 / 삭제 데이터 복구 정책 정리
- [x] Category Project 소속 매핑 정책 반영
- [x] Template Project 소속 및 선택적 Category 적용 정책 반영
- [x] Document Revision 구조 반영
- [x] Relationship World 범위 반영
- [x] 생성 후 변경 불가 데이터 정책 반영
- [x] 조건부 UNIQUE 정책 실제 Drizzle 구현과 동기화

---

# 5. 완료 — API 명세

기준 문서:

```text
references/옴니노드 API 명세서.md
```

- [x] 공통 응답 계약 작성
- [x] HTTP Status 200 고정 규칙 반영
- [x] 문자열 `ResponseCode` 규칙 반영
- [x] 목록 응답 `ListData<T>` 구조 반영
- [x] Auth API 정의
- [x] ADMIN 신청 API 정의
- [x] Admin / SUB_ADMIN / Project Permission API 정의
- [x] World / Project API 정의
- [x] Category / Template API 정의
- [x] Document / Revision API 정의
- [x] Relationship 관련 API 정의

---

# 6. 완료 — Drizzle 스키마 정합화

대상:

```text
server/db/table/
```

## 주요 구조 변경

- [x] `categories.worldId` 제거
- [x] `categories.depth` 1~3 CHECK 추가
- [x] `project_categories`를 사용자 정의 Category의 Project 소속 매핑으로 정합화
- [x] `templates.worldId` 제거
- [x] `project_templates.categoryId` NULL 허용
- [x] Relationship Type / Relationship의 `worldId` 유지
- [x] Document / Revision 구조 유지 확인

## 조건부 UNIQUE

- [x] `project_categories`
- [x] `project_templates`
- [x] `template_headings`
- [x] `relationship_roles`
- [x] `relationship_role_categories`
- [x] `world_relationship_types`
- [x] `world_relationship_role_categories`
- [x] `relationship_targets`
- [x] `world_admins`
- [x] `project_admin_permissions`

---

# 7. 진행 전 — 서버 공통 기반

완료 기준: 이후 모든 API가 공통 DB client와 응답/오류 계약을 재사용할 수 있어야 한다.

- [ ] `server/db/client.ts` 실제 PostgreSQL Drizzle client 구현
- [ ] 전체 table export 구조 정리
- [ ] `BaseResponse<T>` 서버 응답 생성 유틸 작성
- [ ] 모든 애플리케이션 응답 HTTP 200 고정 처리
- [ ] 문자열 `ResponseCode` 기반 성공/오류 응답 유틸 작성
- [ ] 목록 `ListData<T>` 생성 유틸 작성
- [ ] 공통 ID / query / body 파싱 및 입력 검증 기준 작성
- [ ] 인증 관리자 추출 공통 유틸 작성
- [ ] 권한 판정 공통 유틸 작성
- [ ] 소프트 삭제 / 복구 공통 처리 패턴 정리

---

# 8. 진행 전 — 인증 / 관리자

## Auth

- [ ] `POST /api/auth/signin`
- [ ] `POST /api/auth/refresh`
- [ ] `POST /api/auth/signout`
- [ ] `GET /api/auth/me`
- [ ] `PATCH /api/auth/password`
- [ ] 최초 비밀번호 변경 전 일반 보호 API 접근 차단

## ADMIN 신청

- [ ] `POST /api/admin-requests`
- [ ] `GET /api/admin-requests`
- [ ] `GET /api/admin-requests/:requestId`
- [ ] `POST /api/admin-requests/:requestId/approve`
- [ ] `POST /api/admin-requests/:requestId/reject`
- [ ] 승인 시 ADMIN 계정 + 임시 비밀번호 생성
- [ ] 승인 시 World 자동 배정 금지

## Admin

- [ ] 관리자 목록
- [ ] 관리자 상세
- [ ] 관리자 수정
- [ ] 관리자 활성 / 비활성
- [ ] 관리자 소프트 삭제
- [ ] 관리자 복원

## SUB_ADMIN / World Admin

- [ ] World 관리자 구성 조회
- [ ] 신규 SUB_ADMIN 생성 및 World 배정
- [ ] 기존 SUB_ADMIN World 배정
- [ ] SUB_ADMIN World 배정 해제

## Project Permission

- [ ] Project별 SUB_ADMIN 권한 조회
- [ ] Project별 21개 권한 전체 저장
- [ ] 권한 세트 활성 / 비활성
- [ ] 활성 권한 매핑이 없으면 Project 열람 차단

---

# 9. 진행 전 — World / Project

## World

- [ ] 목록
- [ ] 생성
- [ ] 상세
- [ ] 수정
- [ ] 활성 / 비활성
- [ ] 소프트 삭제
- [ ] 복원
- [ ] ADMIN이 World 생성 시 `world_admins` 자동 생성

## Project

- [ ] World의 Project 목록
- [ ] 생성
- [ ] 상세
- [ ] 수정
- [ ] 활성 / 비활성
- [ ] 소프트 삭제
- [ ] 복원
- [ ] 같은 World 내 활성 동일 이름 중복 방지
- [ ] 삭제 동일 이름 생성 요청 시 메인 row 복구

---

# 10. 진행 전 — Category / Template

## Category

- [ ] Project에서 사용 가능한 Category 조회
- [ ] World Relationship 설정용 Category 조회
- [ ] 사용자 정의 Category 생성
- [ ] 상세
- [ ] 수정 가능한 값 범위 적용
- [ ] 활성 / 비활성
- [ ] 소프트 삭제
- [ ] 복원
- [ ] `parentId`, `depth` 생성 후 변경 금지
- [ ] 기본 Category + 같은 Project 사용자 정의 Category만 부모 허용
- [ ] 다른 Project 사용자 정의 Category 부모 금지

## Template

- [ ] Project에서 사용 가능한 Template 조회
- [ ] 사용자 정의 Template 생성
- [ ] 상세
- [ ] Heading 전체 교체 저장
- [ ] 활성 / 비활성
- [ ] 소프트 삭제
- [ ] 복원
- [ ] Category 미할당 상태 지원
- [ ] Category 할당 / 해제
- [ ] 동일 Template의 여러 1단계 Category 적용 지원

---

# 11. 진행 전 — Document / Revision

## Document

- [ ] Project Document 목록
- [ ] 생성
- [ ] 상세
- [ ] Category 수정
- [ ] 활성 / 비활성
- [ ] 소프트 삭제
- [ ] 복원
- [ ] 생성 후 `title` 변경 금지
- [ ] 삭제 동일 title 생성 요청 시 메인 row 복구

## Revision

- [ ] Document 생성 시 최초 Revision 생성
- [ ] 본문 변경 시 신규 Revision 생성
- [ ] 기존 본문과 동일하면 Revision 생성하지 않음
- [ ] Revision 목록
- [ ] Revision 상세
- [ ] 과거 Revision 복원
- [ ] 복원 시 신규 Revision 생성하지 않고 `currentYn` 전환
- [ ] Document 복구 시 기존 Revision 폐기 후 신규 최초 Revision 생성

---

# 12. 진행 전 — Relationship

## Relationship Type

- [ ] World에서 사용할 수 있는 Relationship Type 조회
- [ ] 사용자 정의 Relationship Type 생성
- [ ] 상세
- [ ] 수정
- [ ] 활성 / 비활성
- [ ] 소프트 삭제
- [ ] 복원
- [ ] Role 2~4개 검증
- [ ] Role 허용 Category 검증
- [ ] 복구 시 기존 Role / Category 매핑 폐기 후 재생성

## 기본 Relationship Type World 설정

- [ ] 기본 Relationship Type 활성 / 비활성
- [ ] 기본 Role의 World 추가 허용 Category 관리
- [ ] 같은 World Project의 사용자 정의 Category만 허용

## 실제 Relationship

- [ ] World Relationship 목록
- [ ] 생성
- [ ] 상세
- [ ] 대상 Document 수정
- [ ] 활성 / 비활성
- [ ] 소프트 삭제
- [ ] 복원
- [ ] 생성 후 `relationshipTypeId` 변경 금지
- [ ] 서로 다른 Project Document 연결 지원
- [ ] 모든 대상 Document가 같은 World인지 검증
- [ ] Role / Relationship Type 일치 검증
- [ ] Role별 허용 Category 검증

---

# 13. 진행 전 — UI 연동

서버 API 구현이 완료된 도메인부터 순차 연결한다.

- [ ] Auth 화면 / 상태 연결
- [ ] ADMIN 신청 / 승인 관리 화면 연결
- [ ] 관리자 / SUB_ADMIN / 권한 화면 연결
- [ ] World 관리 화면 연결
- [ ] Project 관리 화면 연결
- [ ] Category 관리 화면 연결
- [ ] Template 관리 화면 연결
- [ ] Document / Revision 화면 연결
- [ ] Relationship 설정 및 실제 관계 관리 화면 연결
- [ ] 서버 조회는 Vue Query 사용
- [ ] 조회 성공 데이터는 필요한 도메인만 Pinia에 동기화

---

# 14. 진행 전 — 최종 정합성 검토

- [ ] DB 명세 ↔ Drizzle 스키마 대조
- [ ] API 명세 ↔ 실제 API 대조
- [ ] 권한 규칙 ↔ 실제 접근 제어 대조
- [ ] 기본 / 사용자 정의 데이터 범위 대조
- [ ] 소프트 삭제 / 동일명 복구 동작 대조
- [ ] Category / Template Project 소속 검증
- [ ] Relationship World 범위 검증
- [ ] API 모든 응답 HTTP 200 / 문자열 `code` 검증
- [ ] TODO 실제 진행 상태 갱신

---

# 15. 현재 상태

```text
설계 재정립
→ 완료

DB 명세
→ 완료

API 명세
→ 완료

Drizzle 스키마 정합화
→ 완료

서버 API 구현
→ 시작 전

UI 연동
→ 시작 전
```

## 다음 시작 지점

```text
단계 7 — 서버 공통 기반
```

첫 작업:

```text
server/db/client.ts 구현
+
공통 API 응답 유틸 구조 확정
```
