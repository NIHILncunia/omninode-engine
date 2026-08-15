# 관리자·권한 관리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended; unavailable for this inline task) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 역할 기본 권한, 관리자별 권한 설정, 프로젝트 서브 어드민 배정을 API와 UI에서 동일하게 적용한다.

**Architecture:** 권한 판정은 `server/services/permission.service.ts`에 집중하고, 관리자·권한·프로젝트 관리자 서비스가 이를 호출한다. Repository는 PostgreSQL Drizzle 조회·저장만 담당하며, API handler는 입력 검증·서비스 호출·표준 응답 변환만 담당한다. 관리자 화면은 기존 `/admins`와 `/projects/:projectId/admins` 라우트에 도메인 컴포넌트를 연결한다.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Pinia 4, Drizzle ORM 0.45, PostgreSQL, Vitest 4, Element Plus, CVA.

## Global Constraints

- 권한 코드는 설계서의 18개 문자열만 사용한다.
- `SUPER_ADMIN`은 전체 권한, `ADMIN`은 자신이 생성한 프로젝트 범위, `SUB_ADMIN`은 배정된 프로젝트의 문서·카테고리·템플릿 범위만 가진다.
- `adminPermissions`의 활성 행은 역할 기본값보다 우선하지만 역할 기본 범위 밖의 권한을 부여할 수 없다.
- 권한 없는 데이터는 목록·검색·직접 URL·API 응답에서 존재를 노출하지 않는다.
- 생성·수정·삭제 API는 `CreateResponse`와 `ApiError`를 사용한다.
- 관리자 삭제와 프로젝트 배정 해제는 `delYn`, `deleteDate`, `deleteId`를 기록하는 소프트 삭제다.
- UI 페이지는 라우팅·메타·데이터 조합만 담당하고, 렌더링은 CVA 컴포넌트가 담당한다.
- 모든 상호작용 함수는 `on<액션><대상>` 형식을 사용하며 `handle*`를 사용하지 않는다.
- 구현 완료 전 `pnpm test`, `pnpm lint`, `pnpm exec vue-tsc --noEmit`, `pnpm build`를 실행한다.

---

### Task 1: 권한 계약과 판정 서비스를 구현한다

**Files:**
- Create: `server/types/permission.types.ts`
- Create: `server/data/permission.data.ts`
- Create: `server/services/permission.service.ts`
- Create: `test/permission-service.test.ts`
- Modify: `app/types/auth.types.ts`

**Interfaces:**
- Consumes: `AuthenticatedAdmin`, PostgreSQL `admins`, `adminPermissions`, `permissions`, `projectAdmins` schema.
- Produces: `PermissionCode`, `PermissionDecisionInput`, `PermissionService`, 역할 기본값 상수.

- [ ] **Step 1: 권한 코드와 역할 기본값의 실패 테스트를 작성한다**

```ts
it('SUPER_ADMIN은 모든 권한을 허용한다', async () => {
  const service = createPermissionService(createDependencies({ role: 'SUPER_ADMIN' }));

  await expect(service.require({
    adminId: 1,
    permission: 'project.delete',
  })).resolves.toBeUndefined();
});

it('SUB_ADMIN은 문서·카테고리·템플릿 외 권한을 거부한다', async () => {
  const service = createPermissionService(createDependencies({
    role: 'SUB_ADMIN',
    assignedProjectIds: [10],
  }));

  await expect(service.can({
    adminId: 2,
    permission: 'project.update',
    projectId: 10,
  })).resolves.toBe(false);
});
```

- [ ] **Step 2: 테스트가 권한 서비스 부재로 실패하는지 확인한다**

Run: `pnpm exec vitest run test/permission-service.test.ts`

Expected: `server/services/permission.service.ts`의 export 부재로 FAIL한다.

- [ ] **Step 3: 권한 코드와 역할 기본값을 선언한다**

`server/types/permission.types.ts`에 다음 리터럴 타입을 선언한다.

```ts
export const permissionCodes = [
  'project.create', 'project.update', 'project.delete',
  'world.create', 'world.update', 'world.delete',
  'document.create', 'document.update', 'document.delete',
  'category.create', 'category.update', 'category.delete',
  'template.create', 'template.update', 'template.delete',
  'project_sub_admin.invite',
  'project_sub_admin.update',
  'project_sub_admin.expel',
] as const;

export type PermissionCode = typeof permissionCodes[number];
```

`server/data/permission.data.ts`에는 각 코드의 표시명·그룹·역할 기본값을 둔다. `SUPER_ADMIN`은 전체 코드, `ADMIN`은 전체 코드의 프로젝트 범위, `SUB_ADMIN`은 문서·카테고리·템플릿 코드만 기본 `Y`로 둔다.

- [ ] **Step 4: 권한 repository 의존성 인터페이스를 구현한다**

`PermissionServiceDependencies`는 다음 조회 함수를 제공한다.

```ts
interface PermissionServiceDependencies {
  findActiveAdmin(adminId: number): Promise<{ id: number; role: AdminRole } | undefined>;
  findActiveOverride(adminId: number, code: PermissionCode): Promise<'Y' | 'N' | undefined>;
  isProjectOwner(projectId: number, adminId: number): Promise<boolean>;
  isAssignedProjectAdmin(projectId: number, adminId: number): Promise<boolean>;
}
```

- [ ] **Step 5: `can`, `require`, `assertAssignable`를 최소 구현한다**

`can`은 관리자 상태·역할 기본값·override·프로젝트 범위를 순서대로 확인한다. `require`는 false일 때 `ApiError(403, 'FORBIDDEN')`을 던진다. 프로젝트 대상이 존재하지 않거나 접근 범위 밖이면 호출 서비스가 `NOT_FOUND`로 숨길 수 있도록 `assertProjectScope`를 별도 내부 함수로 둔다.

- [ ] **Step 6: override와 프로젝트 범위 테스트를 통과시킨다**

검증 대상:

- 활성 `grantYn = 'N'`은 역할 기본 `Y`를 차단한다.
- 비활성·삭제 override는 무시한다.
- 역할 기본 범위 밖의 override `Y`는 허용하지 않는다.
- `ADMIN`은 소유 프로젝트만 허용한다.
- `SUB_ADMIN`은 활성 `projectAdmins` 배정 프로젝트만 허용한다.
- 프로젝트 ID가 없는 전역 권한 요청은 `SUPER_ADMIN`만 허용한다.

Run: `pnpm exec vitest run test/permission-service.test.ts`

- [ ] **Step 7: 타입 검사를 실행한다**

Run: `pnpm exec vue-tsc --noEmit`

- [ ] **Step 8: 커밋한다**

```bash
git add server/types/permission.types.ts server/data/permission.data.ts server/services/permission.service.ts app/types/auth.types.ts test/permission-service.test.ts
git commit -m "2026 0816 feat: 관리자 권한 판정 서비스 추가"
```

### Task 2: 관리자·권한 repository와 서비스 계약을 구현한다

**Files:**
- Create: `server/repositories/permission.repository.ts`
- Create: `server/repositories/administrator.repository.ts`
- Create: `server/services/administrator.service.ts`
- Create: `test/administrator-service.test.ts`
- Modify: `server/repositories/admin.repository.ts`
- Modify: `server/services/permission.service.ts`

**Interfaces:**
- Consumes: Task 1의 `PermissionCode`, `PermissionService`, 기존 `AuthServiceDependencies` 패턴.
- Produces: 관리자 목록·생성·상세·수정·삭제, 권한 조회·수정, 권한 마스터 조회, 프로젝트 관리자 배정에 필요한 서비스 인터페이스.

- [ ] **Step 1: 관리자 서비스 실패 테스트를 작성한다**

다음 동작을 각각 단일 테스트로 작성한다.

- `SUPER_ADMIN`만 전역 관리자 목록을 조회한다.
- `ADMIN`은 전역 관리자 목록을 조회할 수 없다.
- 관리자 생성 시 임시 비밀번호와 변경 필요 상태가 저장된다.
- `SUPER_ADMIN`은 `ADMIN`과 `SUB_ADMIN`을 수정할 수 있다.
- `ADMIN`은 자신이 관리하는 프로젝트의 `SUB_ADMIN` 외 계정을 수정할 수 없다.
- 마지막 `SUPER_ADMIN` 삭제와 자기 자신의 비활성화는 거부한다.
- 권한 override 수정은 역할 기본 범위 밖의 `Y`를 거부한다.

- [ ] **Step 2: 실패를 확인한다**

Run: `pnpm exec vitest run test/administrator-service.test.ts`

Expected: repository와 service 모듈 부재로 FAIL한다.

- [ ] **Step 3: repository 조회·저장 인터페이스를 선언한다**

`administrator.repository.ts`에는 다음 메서드를 둔다.

```ts
list(input: { page: number; pageSize: number; search?: string }): Promise<ListResult<AdminSummary>>;
findById(adminId: number): Promise<AdminDetail | undefined>;
findByEmail(email: string): Promise<AdminDetail | undefined>;
insert(input: CreateAdminRecord): Promise<AdminDetail>;
update(adminId: number, input: UpdateAdminRecord): Promise<AdminDetail>;
softDelete(adminId: number, actorAdminId: number, now: Date): Promise<void>;
countActiveSuperAdmins(excludeAdminId?: number): Promise<number>;
restoreByEmail(email: string, actorAdminId: number, now: Date): Promise<AdminDetail | undefined>;
```

`permission.repository.ts`에는 권한 마스터와 관리자별 override 조회·upsert 메서드, `projectAdmins` 활성 배정 조회·upsert·soft delete 메서드를 둔다.

- [ ] **Step 4: 관리자 생성·수정·삭제 서비스를 구현한다**

서비스는 입력을 정규화하고 권한 서비스를 먼저 호출한다. 생성 시 `randomBytes` 기반 임시 비밀번호를 만들고 해시만 DB에 저장한다. 이메일 발송은 `AdminInvitationSender` 주입 인터페이스로 호출하며, 구현체가 없는 개발 환경에서는 생성 결과에 비밀번호를 반환하지 않는다.

- [ ] **Step 5: 권한 조회·수정 서비스를 구현한다**

18개 권한 마스터와 대상 관리자의 최종 권한을 함께 반환한다. 수정 요청은 `{ code, grantYn }[]`를 받고 중복 코드를 거부한다. 역할 기본 범위 밖의 `grantYn = 'Y'`는 `FORBIDDEN`으로 거부하고, 기존 override 행은 `grantYn`, `updateId`, `updateDate`를 갱신한다.

- [ ] **Step 6: 관리자 서비스 테스트를 통과시킨다**

Run: `pnpm exec vitest run test/administrator-service.test.ts test/permission-service.test.ts`

- [ ] **Step 7: 타입 검사를 실행한다**

Run: `pnpm exec vue-tsc --noEmit`

- [ ] **Step 8: 커밋한다**

```bash
git add server/repositories/permission.repository.ts server/repositories/administrator.repository.ts server/services/administrator.service.ts server/repositories/admin.repository.ts server/services/permission.service.ts test/administrator-service.test.ts
git commit -m "2026 0816 feat: 관리자 권한 서비스 추가"
```

### Task 3: 관리자·권한 API를 구현한다

**Files:**
- Create: `server/api/admins/index.get.ts`
- Create: `server/api/admins/index.post.ts`
- Create: `server/api/admins/[adminId].get.ts`
- Create: `server/api/admins/[adminId].patch.ts`
- Create: `server/api/admins/[adminId].delete.ts`
- Create: `server/api/permissions/index.get.ts`
- Create: `server/api/admins/[adminId]/permissions.get.ts`
- Create: `server/api/admins/[adminId]/permissions.patch.ts`
- Create: `test/administrator-api.test.ts`

**Interfaces:**
- Consumes: Task 2의 관리자 서비스와 기존 `readValidatedAuthBody`, `toAuthErrorResponse`, `CreateResponse`.
- Produces: 설계서의 전역 관리자·권한 API 8개.

- [ ] **Step 1: 각 endpoint의 입력·권한·응답 실패 테스트를 작성한다**

검증할 입력은 다음과 같다.

- 목록: `page`, `pageSize`, `search`
- 생성: 이메일·이름·역할
- 수정: 이름·역할·활성 상태
- 권한 수정: 고유한 18개 코드와 `Y/N`
- 경로 ID: 양의 정수

권한 없는 호출은 `403`, 접근할 수 없는 대상은 `404`, 잘못된 입력은 `400`을 기대한다.

- [ ] **Step 2: 실패를 확인한다**

Run: `pnpm exec vitest run test/administrator-api.test.ts`

Expected: API 모듈 부재로 FAIL한다.

- [ ] **Step 3: 인증 관리자 추출 공통 함수를 추가한다**

`server/utils/administrator-request.ts`에 access cookie에서 인증 관리자를 가져오고, 실패 시 `UNAUTHORIZED`를 반환하는 함수를 둔다. API handler는 이 함수로 얻은 `adminId`를 서비스에 전달한다.

- [ ] **Step 4: 관리자·권한 handler를 구현한다**

각 handler는 `readBody` 또는 `getQuery`로 입력을 읽고 타입 가드를 통과시킨 뒤 서비스 메서드를 호출한다. 성공은 `CreateResponse.data` 또는 `CreateResponse.list`, 실패는 `toAuthErrorResponse`를 통해 표준 응답으로 반환한다.

- [ ] **Step 5: API 테스트를 통과시킨다**

Run: `pnpm exec vitest run test/administrator-api.test.ts`

다음 결과를 확인한다.

- 성공 응답의 `data`에 비밀번호 해시와 임시 비밀번호가 포함되지 않는다.
- 관리자 목록은 페이지 정보를 포함한다.
- 권한 수정은 중복 코드와 허용되지 않은 코드를 거부한다.
- 권한 없는 요청은 서비스 호출 전에 거부된다.

- [ ] **Step 6: 커밋한다**

```bash
git add server/api/admins server/api/permissions server/utils/administrator-request.ts test/administrator-api.test.ts
git commit -m "2026 0816 feat: 관리자 및 권한 API 추가"
```

### Task 4: 전역 관리자 UI를 실제 API에 연결한다

**Files:**
- Create: `app/components/admin/AdminList.vue`
- Create: `app/components/admin/AdminCreateForm.vue`
- Create: `app/components/admin/AdminDetail.vue`
- Create: `app/components/admin/AdminEditForm.vue`
- Create: `app/components/admin/AdminPermissionForm.vue`
- Modify: `app/pages/admins/index.vue`
- Modify: `app/pages/admins/new.vue`
- Modify: `app/pages/admins/[adminId]/index.vue`
- Modify: `app/pages/admins/[adminId]/edit.vue`
- Modify: `app/pages/admins/[adminId]/permissions.vue`
- Create: `test/administrator-ui.test.ts`

**Interfaces:**
- Consumes: Task 3 API 계약, 기존 query composables, 공통 Loading·Empty·Error 상태 UI.
- Produces: 전역 관리자 목록·생성·상세·수정·권한 화면.

- [ ] **Step 1: UI 실패 테스트를 작성한다**

각 화면에서 API 호출 경로와 핵심 상태를 검증한다.

- 목록은 `/api/admins`를 호출한다.
- 생성은 `POST /api/admins`를 호출한다.
- 권한 화면은 대상 관리자 권한을 조회하고 수정한다.
- 로딩·빈 목록·API 오류 상태를 표시한다.
- `SUB_ADMIN`에게 관리자 화면을 노출하지 않는다.

- [ ] **Step 2: 실패를 확인한다**

Run: `pnpm exec vitest run test/administrator-ui.test.ts`

- [ ] **Step 3: CVA 기반 관리자 컴포넌트를 구현한다**

모든 컴포넌트는 `class` prop을 받고 `cn()`으로 외부 클래스를 병합한다. 이벤트 함수는 `onSearchAdmin`, `onSubmitAdmin`, `onUpdateAdminPermission`과 같이 명명한다.

- [ ] **Step 4: 페이지에 컴포넌트와 API 상태를 연결한다**

페이지 파일에는 `useSetMeta`, route param/query 조합, 컴포넌트 호출만 둔다. 데이터 갱신·폼 제출·오류 상태는 컴포넌트 또는 도메인 composable에서 처리한다.

- [ ] **Step 5: UI 테스트와 타입 검사를 통과시킨다**

Run: `pnpm exec vitest run test/administrator-ui.test.ts && pnpm exec vue-tsc --noEmit`

- [ ] **Step 6: 커밋한다**

```bash
git add app/components/admin app/pages/admins test/administrator-ui.test.ts
git commit -m "2026 0816 feat: 전역 관리자 관리 화면 추가"
```

### Task 5: 프로젝트 관리자 API와 UI를 구현한다

**Files:**
- Create: `server/services/project-admin.service.ts`
- Create: `server/api/projects/[projectId]/admins/index.get.ts`
- Create: `server/api/projects/[projectId]/admins/index.post.ts`
- Create: `server/api/projects/[projectId]/admins/[adminId].patch.ts`
- Create: `server/api/projects/[projectId]/admins/[adminId].delete.ts`
- Create: `app/components/project/ProjectAdminList.vue`
- Create: `app/components/project/ProjectAdminInviteForm.vue`
- Modify: `app/pages/projects/[projectId]/admins.vue`
- Create: `test/project-admin-service.test.ts`
- Create: `test/project-admin-api.test.ts`
- Create: `test/project-admin-ui.test.ts`

**Interfaces:**
- Consumes: Task 1 권한 서비스와 Task 2 projectAdmins repository 계약.
- Produces: 프로젝트 서브 어드민 초대·재초대·비활성화·배정 해제 기능.

- [ ] **Step 1: 프로젝트 관리자 서비스 실패 테스트를 작성한다**

- `ADMIN`은 자신의 프로젝트에서만 `SUB_ADMIN`을 배정할 수 있다.
- `SUPER_ADMIN`은 모든 프로젝트에서 배정할 수 있다.
- `SUB_ADMIN`은 프로젝트 관리자 API를 호출할 수 없다.
- `ADMIN`을 프로젝트 서브 어드민으로 배정할 수 없다.
- 이미 삭제된 동일 배정은 복구한다.
- 배정 해제는 `delYn = 'Y'`로 처리한다.

- [ ] **Step 2: 실패를 확인하고 서비스를 구현한다**

Run: `pnpm exec vitest run test/project-admin-service.test.ts`

서비스는 대상 이메일로 활성 관리자 계정을 찾고 역할이 `SUB_ADMIN`인지 확인한 뒤 `projectAdmins`를 생성·복구·갱신한다. 초대·재초대는 임시 비밀번호 발급과 이메일 발송 경계를 재사용한다.

- [ ] **Step 3: 프로젝트 관리자 API handler를 구현한다**

Run: `pnpm exec vitest run test/project-admin-api.test.ts`

모든 API는 `projectId`와 `adminId`를 양의 정수로 검증하고, 접근할 수 없는 프로젝트는 `NOT_FOUND`로 응답한다.

- [ ] **Step 4: 프로젝트 관리자 UI를 구현한다**

Run: `pnpm exec vitest run test/project-admin-ui.test.ts`

초대·재초대·비활성화·배정 해제 상태를 구분하여 표시하고, API 응답 후 목록을 재조회한다. `SUB_ADMIN`은 화면 자체에 접근하지 못한다.

- [ ] **Step 5: 타입 검사를 실행하고 커밋한다**

Run: `pnpm exec vue-tsc --noEmit`

```bash
git add server/services/project-admin.service.ts server/api/projects app/components/project app/pages/projects/[projectId]/admins.vue test/project-admin-*.test.ts
git commit -m "2026 0816 feat: 프로젝트 관리자 관리 추가"
```

### Task 6: 통합 권한 검증과 단계 완료 기록

**Files:**
- Modify: `test/permission-access.integration.test.ts`
- Modify: `TODO.md`
- Modify: `docs/superpowers/specs/2026-08-16-admin-permission-management-design.md`
- Modify: `docs/superpowers/plans/2026-08-16-admin-permission-management.md`

**Interfaces:**
- Consumes: Tasks 1~5의 권한 서비스·API·UI.
- Produces: 관리자·권한 단계의 통합 회귀 검증과 완료 기록.

- [ ] **Step 1: 데이터 비노출 통합 테스트를 작성한다**

다음 네 경로를 각각 검증한다.

- 권한 없는 관리자 목록
- 권한 없는 검색 결과
- 권한 없는 직접 URL
- 권한 없는 API 응답

`NOT_FOUND` 응답에는 대상 이름·ID·권한 상태를 포함하지 않는다.

- [ ] **Step 2: 전체 검증을 실행한다**

```bash
pnpm test
pnpm lint
pnpm exec vue-tsc --noEmit
pnpm build
```

변경 파일과 무관한 기존 린트 오류가 있으면 `TODO.md`에 파일·오류 수·무관한 이유를 기록한다.

- [ ] **Step 3: 문서의 체크박스와 검증 결과를 갱신한다**

설계 문서와 이 계획의 완료 항목을 실제 검증 결과와 일치시키고, `TODO.md`의 현재 상태를 단계 3 프로젝트 관리로 변경한다. 완료 전에는 어떤 항목도 `[x]`로 표시하지 않는다.

- [ ] **Step 4: 단계 완료 커밋을 생성한다**

```bash
git add TODO.md docs/superpowers/specs/2026-08-16-admin-permission-management-design.md docs/superpowers/plans/2026-08-16-admin-permission-management.md test/permission-access.integration.test.ts
git commit -m "2026 0816 feat: 관리자 권한 관리 추가"
```
