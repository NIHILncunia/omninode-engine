# 승인형 어드민 요청과 프로젝트별 권한 정정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 승인된 이메일 관리자만 프로젝트를 만들고, 각 프로젝트의 18개 권한으로 모든 관리 동작을 판정한다.

**Architecture:** 공개 요청·SUPER_ADMIN 승인·SMTP 자격 증명 전달은 독립 서비스로 두고, 프로젝트 권한은 `project_admins` 배정과 `admin_permissions` 18개 행을 같은 트랜잭션에서 관리한다. 프로젝트 생성은 다음 단계의 CRUD 서비스가 권한 초기화 함수를 호출해 완성한다.

**Tech Stack:** Nuxt 4, Vue 3, PostgreSQL Drizzle, Nodemailer SMTP, Vitest, Element Plus, CVA.

## Global Constraints

- 계정명은 `admins.email`, 닉네임은 `admins.name`이다.
- `SUPER_ADMIN`만 전역 우회를 가지며, 일반 관리자는 모두 `ADMIN`이다.
- 프로젝트 권한의 유일한 저장소는 `(project_id, admin_id, permission_id)` 고유 `admin_permissions` 행이다.
- 비밀번호 원문은 DB·로그·API 응답에 저장하지 않고 SMTP 이메일로만 전달한다.
- 기존 `9b0d34f`를 되돌리거나 강제 푸시하지 않고 정정 커밋으로 대체한다.

---

### Task 1: 스키마·마이그레이션과 SMTP 구성 계약

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`, `nuxt.config.ts`, `.env.development.example`, `.env.production.example`
- Create: `server/db/schema/postgresql/adminPermissionRequests.table.ts`, `server/utils/admin-credential-mailer.ts`
- Modify: `server/db/schema/postgresql/admins.table.ts`, `adminPermissions.table.ts`, `index.ts`, `test/database-schema.test.ts`
- Create: `test/admin-credential-mailer.test.ts`

- [ ] **Step 1: 스키마 실패 테스트를 작성한다.**

```ts
expect(postgresqlSchema.adminPermissionRequests).toHaveProperty('status');
expect(postgresqlSchema.adminPermissions).toHaveProperty('projectId');
expect(postgresqlSchema.adminPermissions.projectId.notNull).toBe(true);
```

- [ ] **Step 2: 테스트가 새 테이블·열 부재로 실패하는지 확인한다.**

Run: `pnpm exec vitest run test/database-schema.test.ts`

- [ ] **Step 3: Drizzle 스키마를 바꾼다.**

`admin_permission_requests`에는 설계서의 요청·검토·전달 상태 열과 `PENDING` 이메일 부분 고유 인덱스를 선언한다. `admins.role`은 `SUPER_ADMIN | ADMIN`으로 제한하고 기존 `SUB_ADMIN`을 `ADMIN`으로 바꾸는 SQL 마이그레이션을 만든다. `admin_permissions`에 `projectId` FK·3열 고유 인덱스·프로젝트 조회 인덱스를 선언한다.

- [ ] **Step 4: SMTP 전달자를 구현한다.**

`nodemailer`와 `@types/nodemailer`를 추가하고, private runtime config의 SMTP 값으로 transport를 만든다. 필수 값이 없으면 `isConfigured()`가 false를 반환하고 `sendInitialPassword()`는 호출되지 않게 한다.

```ts
export interface AdminCredentialMailer {
  isConfigured(): boolean;
  sendInitialPassword(input: { email: string; name: string; password: string }): Promise<void>;
}
```

- [ ] **Step 5: 마이그레이션을 생성·검토하고 대상 테스트를 통과시킨다.**

Run: `pnpm db:dev:generate; pnpm exec vitest run test/database-schema.test.ts test/admin-credential-mailer.test.ts`

생성 SQL에 `SUB_ADMIN → ADMIN`, `project_id` 추가, 기존 전역 권한 행의 안전한 정리, 요청 테이블·인덱스가 모두 포함됐는지 확인한다.

### Task 2: 공개 요청과 SUPER_ADMIN 승인 서비스

**Files:**
- Create: `server/repositories/admin-permission-request.repository.ts`, `server/services/admin-permission-request.service.ts`, `server/types/admin-permission-request.types.ts`, `test/admin-permission-request.service.test.ts`
- Modify: `server/repositories/administrator.repository.ts`, `server/types/administrator.types.ts`, `server/services/administrator.server.ts`

- [ ] **Step 1: 요청·승인·거절·재발송 실패 테스트를 작성한다.**

```ts
await expect(service.submit({ email: 'a@example.com', name: '가람' })).resolves.toMatchObject({ status: 'PENDING' });
await expect(service.approve({ actorAdminId: 1, requestId: 2 })).resolves.toMatchObject({ status: 'APPROVED' });
await expect(service.submit({ email: 'a@example.com', name: '가람' })).rejects.toMatchObject({ code: 'CONFLICT' });
```

- [ ] **Step 2: 요청 저장소와 서비스 최소 구현을 작성한다.**

서비스는 이메일 정규화, 중복 PENDING·활성 계정 거부, SUPER_ADMIN 확인, PENDING 단일 전이를 수행한다. SMTP 미설정이면 승인 전 `INTERNAL_SERVER_ERROR`로 거부한다.

- [ ] **Step 3: 승인·전달 실패 복구를 구현한다.**

승인은 DB 트랜잭션에서 ADMIN 생성과 요청 승인 상태를 확정한다. 발송 성공·실패 시 전달 날짜를 별도 갱신한다. 재발송은 실패 요청에서 새 임시 비밀번호 hash를 갱신하고 다시 보낸다. 비밀번호는 어떤 반환 DTO에도 넣지 않는다.

- [ ] **Step 4: 서비스 테스트를 통과시킨다.**

Run: `pnpm exec vitest run test/admin-permission-request.service.test.ts`

### Task 3: 요청 API·공개 화면·SUPER_ADMIN 검토 화면

**Files:**
- Create: `server/api/admin-permission-requests/index.post.ts`, `[requestId].get.ts`, `index.get.ts`, `[requestId]/approve.post.ts`, `[requestId]/reject.post.ts`, `[requestId]/resend-initial-password.post.ts`
- Create: `app/pages/admin-permission-request.vue`, `app/components/admin/AdminPermissionRequestForm.vue`, `AdminPermissionRequestList.vue`, `AdminPermissionRequestReviewDialog.vue`, `test/admin-permission-request-api.test.ts`, `test/admin-permission-request-ui.test.ts`
- Modify: `app/pages/admins/index.vue`, `app/components/admin/AdminList.vue`, `app/middleware/auth.global.ts`

- [ ] **Step 1: API와 UI 실패 테스트를 작성한다.**

공개 `POST`는 이메일·닉네임만 받고, 비인증 요청은 목록·승인 API에서 401/403을 받으며, 일반 ADMIN은 SUPER_ADMIN 요청 목록을 볼 수 없음을 검증한다.

- [ ] **Step 2: API handler를 구현한다.**

각 handler는 양의 `requestId`, 이메일 길이 320, 닉네임 길이 100, 거절 사유 길이 500을 검증하고 `CreateResponse`를 반환한다. 전달 실패는 비밀번호·SMTP 상세를 노출하지 않는다.

- [ ] **Step 3: Element Plus 화면을 구현한다.**

`/admin-permission-request`는 auth 레이아웃에서 요청 폼과 완료 상태를 보여 준다. `/admins`에서는 SUPER_ADMIN만 요청 목록과 승인·거절·재발송 `ElDialog`를 사용한다.

- [ ] **Step 4: API·UI 테스트를 통과시킨다.**

Run: `pnpm exec vitest run test/admin-permission-request-api.test.ts test/admin-permission-request-ui.test.ts`

### Task 4: 프로젝트별 권한 저장소와 판정 서비스 교체

**Files:**
- Modify: `server/types/permission.types.ts`, `server/types/administrator.types.ts`, `server/repositories/permission.repository.ts`, `server/services/permission.service.ts`, `server/services/project-admin.service.ts`
- Create: `test/project-permission.service.test.ts`
- Delete: 전역 권한 override 전용 메서드와 역할 기본값 판정 코드

- [ ] **Step 1: 프로젝트별 판정 실패 테스트를 작성한다.**

```ts
await expect(service.can({ adminId: 2, projectId: 10, permission: 'world.create' })).resolves.toBe(true);
await expect(service.can({ adminId: 2, projectId: 11, permission: 'world.create' })).resolves.toBe(false);
await expect(service.can({ adminId: 1, projectId: 11, permission: 'world.create' })).resolves.toBe(true);
```

- [ ] **Step 2: 배정과 18개 권한 행의 트랜잭션 인터페이스를 구현한다.**

```ts
assignProjectAdmin(input: {
  projectId: number; adminId: number; grants: Record<PermissionCode, PermissionGrant>; actorAdminId: number;
}): Promise<void>;
```

저장소는 활성 배정 upsert와 18개 권한 행 upsert를 하나의 transaction으로 수행한다.

- [ ] **Step 3: 권한 서비스를 교체한다.**

SUPER_ADMIN은 우회한다. `project.create`는 활성 ADMIN만 허용하고, 나머지는 활성 배정과 `grantYn = 'Y'`를 요구한다. 프로젝트가 보이지 않으면 호출 서비스가 `NOT_FOUND`를 반환하게 한다.

- [ ] **Step 4: 프로젝트 권한 테스트를 통과시킨다.**

Run: `pnpm exec vitest run test/project-permission.service.test.ts`

### Task 5: 프로젝트 관리자 팝업과 전역 권한 화면 제거

**Files:**
- Modify: `app/components/project/ProjectAdminManagement.vue`, `ProjectAdminList.vue`, `ProjectAdminInviteForm.vue`, `app/pages/projects/[projectId]/admins.vue`, 프로젝트 관리자 API·서비스
- Delete: `app/pages/admins/[adminId]/permissions.vue`, `app/pages/admin/permissions.vue`, `app/components/admin/AdminPermissionForm.vue`, `/api/admins/:adminId/permissions`, `/api/permissions`
- Modify: 관리자 라우트·sidebar 테스트와 관련 페이지 링크

- [ ] **Step 1: 팝업 UI 실패 테스트를 작성한다.**

기존 승인 관리자 선택, 18개 체크박스, 저장 요청의 `permissions` payload, 해제 확인을 검증한다.

- [ ] **Step 2: 프로젝트 관리자 API를 권한 payload 계약으로 바꾼다.**

`POST/PATCH /api/projects/:projectId/admins`는 `{ adminId, permissions }`를 받고 신규 계정을 만들지 않는다. `DELETE`는 배정과 권한 행을 소프트 삭제한다.

- [ ] **Step 3: `ElDialog` 권한 행렬을 구현하고 이전 전역 화면을 제거한다.**

- [ ] **Step 4: 대상 UI·API 테스트와 라우트 회귀 테스트를 통과시킨다.**

Run: `pnpm exec vitest run test/project-admin-*.test.ts test/admin-route-scaffolding.test.ts`

프로젝트 생성 시 권한 초기화의 실제 호출은 다음 단계 3 계획에서 완료한다. 이 단계에서는 `assignProjectAdmin` 인터페이스와 권한 초기화 트랜잭션을 재사용 가능하게 제공한다.

### Task 6: 검증·추적·완료 기록

**Files:**
- Modify: `AGENTS.md`, `TODO.md`, 현재 단계 2 설계·계획 문서
- Add: `docs/superpowers/reports/2026-08-16-admin-request-project-permission-correction-completion.md`
- Track: 기존 단계 0·1 완료 리포트

- [ ] **Step 1: 회귀 테스트와 린트 문제를 고친다.**

`test/admin-route-scaffolding.test.ts`는 실제 렌더링 컴포넌트를, `test/app-sidebar.test.ts`는 Pinia와 Icon stub을 사용하도록 정정한다. 단계 2 신규 파일의 ESLint 포맷 오류를 모두 수정한다.

- [ ] **Step 2: 전체 검증을 실행한다.**

Run: `pnpm test; pnpm lint; pnpm exec vue-tsc --noEmit; pnpm build; git diff --check`

- [ ] **Step 3: 문서를 실제 결과에 맞춘다.**

TODO를 완료된 단계만 체크하고, AGENTS에 완료 리포트 규칙을 반영하며, 단계 0·1·2 보고서를 추적한다.

- [ ] **Step 4: 완료 커밋을 만든다.**

```text
2026 0816 feat: 승인형 관리자 및 프로젝트 권한 관리 추가
```
