# Refresh JWT 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** access와 refresh를 서로 다른 secret으로 서명한 JWT로 운용하고, 개발·운영 환경에 필요한 secret을 적용한다.

**Architecture:** `server/utils/auth.ts`가 access·refresh JWT의 생성·검증을 분리한다. auth service는 refresh JWT를 먼저 검증하고, JWT subject와 DB의 SHA-256 token hash 행을 함께 확인한 뒤 token을 회전한다. runtime config는 두 secret을 서버 전용으로 전달하며 환경 파일은 환경별 독립 난수를 보관한다.

**Tech Stack:** Nuxt 4, Nitro, jose, node:crypto, PostgreSQL Drizzle, Vitest.

## Global Constraints

- access JWT 만료는 정확히 1시간이며 `JWT_ACCESS_SECRET`을 사용한다.
- refresh JWT 만료는 정확히 7일이며 `JWT_REFRESH_SECRET`을 사용한다.
- access secret은 base62 120자, refresh secret은 base62 160자다.
- 개발과 운영은 서로 다른 secret 쌍을 사용한다.
- refresh JWT 원문은 DB에 저장하지 않고 SHA-256 해시만 저장한다.
- access JWT는 refresh endpoint에서 사용할 수 없어야 한다.
- 실제 secret은 로그·테스트 출력·문서에 기록하지 않는다.

---

### Task 1: access·refresh JWT 유틸리티 분리

**Files:**
- Modify: `server/utils/auth.ts`
- Modify: `server/types/auth.types.ts`
- Modify: `test/auth-utils.test.ts`

**Interfaces:**
- Produces: `createAccessToken(payload, secret)` with a 1-hour expiry.
- Produces: `createRefreshToken(adminId, secret)` with a 7-day expiry, `tokenUse: 'refresh'`, and random `jti`.
- Produces: `verifyRefreshToken(token, secret): Promise<{ adminId: number }>` that rejects access tokens and malformed subjects.

- [ ] **Step 1: Write failing utility tests**

```ts
await expect(createRefreshToken(1, refreshSecret)).resolves.toContain('.');
await expect(verifyRefreshToken(refreshToken, refreshSecret)).resolves.toEqual({ adminId: 1, });
await expect(verifyRefreshToken(accessToken, refreshSecret)).rejects.toThrow();
```

- [ ] **Step 2: Run the utility test to verify failure**

Run: `pnpm test -- auth-utils.test.ts`

Expected: FAIL because refresh JWT utility functions do not exist.

- [ ] **Step 3: Implement minimal refresh JWT functions**

```ts
export async function createRefreshToken(adminId: number, secret: string): Promise<string> {
  return new SignJWT({ tokenUse: 'refresh', })
    .setProtectedHeader({ alg: 'HS256', })
    .setIssuer('omninode')
    .setSubject(String(adminId))
    .setJti(randomBytes(24).toString('base64url'))
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(toSecretKey(secret));
}
```

`verifyRefreshToken`은 issuer, `tokenUse`, 양의 안전 정수 subject를 모두 검증한다. `createAccessToken`의 만료를 `'1h'`로 바꾼다.

- [ ] **Step 4: Run the utility test to verify pass**

Run: `pnpm test -- auth-utils.test.ts`

Expected: PASS.

### Task 2: auth service refresh JWT 검증·회전

**Files:**
- Modify: `server/services/auth.service.ts`
- Modify: `server/services/auth.server.ts`
- Modify: `test/auth-service.test.ts`

**Interfaces:**
- Consumes: `createRefreshToken(adminId, refreshSecret)` and `verifyRefreshToken(token, refreshSecret)`.
- Produces: refresh JWT subject와 `admin_refresh_tokens.admin_id`가 일치할 때만 회전하는 `refresh` service.

- [ ] **Step 1: Write failing auth service tests**

```ts
await expect(authService.refresh({ refreshToken: 'refresh-token', })).rejects.toMatchObject({ code: 'UNAUTHORIZED', });
```

The fake `verifyRefreshToken` returns `{ adminId: 2 }` while the active DB token fake belongs to admin ID 1. Add a separate assertion that `createRefreshToken` receives admin ID 1 during signin.

- [ ] **Step 2: Run the service test to verify failure**

Run: `pnpm test -- auth-service.test.ts`

Expected: FAIL because the service currently creates opaque refresh tokens and does not compare JWT subject with the DB token owner.

- [ ] **Step 3: Implement minimal service dependency changes**

```ts
createRefreshToken: (adminId: number) => Promise<string>;
verifyRefreshToken: (refreshToken: string) => Promise<{ adminId: number }>;
```

Call `createRefreshToken(admin.id)` in `issueSession`. In `refresh`, verify the JWT before the DB hash lookup; after lookup reject when `payload.adminId !== refreshToken.adminId`.

- [ ] **Step 4: Wire the runtime service with both secrets**

`getAuthService` requires both `jwtAccessSecret` and `jwtRefreshSecret`, then passes them to default dependencies. Missing either setting throws a startup error before token handling.

- [ ] **Step 5: Run the service test to verify pass**

Run: `pnpm test -- auth-service.test.ts auth-api.test.ts`

Expected: PASS.

### Task 3: runtime config·환경 secret·통합 검증

**Files:**
- Modify: `nuxt.config.ts`
- Modify: `package.json`
- Modify: `.env.development`, `.env.production`
- Modify: `.env.development.example`, `.env.production.example`

**Interfaces:**
- Consumes: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, existing `DATABASE_URL`, and SMTP config.
- Produces: 개발·운영에 각각 다른 base62 access 120자·refresh 160자 secret 설정 및 누락 환경 변수 점검 결과.

- [ ] **Step 1: Add server-only refresh runtime config and example placeholders**

```ts
runtimeConfig: {
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
}
```

Add `JWT_REFRESH_SECRET='<JWT_REFRESH_SECRET>'` to both example files. Update `dev`, `build`, and `preview` scripts to pass their explicit development or production dotenv file to Nuxt.

- [ ] **Step 2: Generate and apply actual environment secrets without output**

Generate four independent values with `crypto.randomBytes`, discard non-alphanumeric characters, and retain exactly 120 or 160 characters. Write one access·refresh pair to each actual environment file. Do not print the values.

- [ ] **Step 3: Audit environment variable presence without disclosing values**

Report presence only for `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` in both environment files.

- [ ] **Step 4: Run focused and integration verification**

Run: `pnpm test -- auth-utils.test.ts auth-service.test.ts auth-api.test.ts`

Then restart the development server and run a cookie-preserving sequence: `POST /api/auth/signin` → `POST /api/auth/refresh` → `GET /api/auth/me`. Assert 200 responses, SUPER_ADMIN identity, and rotated refresh cookie. Do not print cookies or tokens.

- [ ] **Step 5: Run complete verification and stage commit**

Run: `pnpm test && pnpm lint && pnpm exec vue-tsc --noEmit && pnpm build && git diff --check`

Commit after all Task 1–3 checks pass:

```text
2026 0816 feat: refresh JWT 인증 전환
```
