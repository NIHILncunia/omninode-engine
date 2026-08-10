# Nuxt Template Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable Nuxt template with minimal page structure, frontend query composables, and PostgreSQL Drizzle starter setup.

**Architecture:** Generate a standard Nuxt project with Tailwind and ESLint enabled, then remove demo surface area until only a single `pages/index.vue` remains. Add a small query helper layer under `composables/query` that separates `useFetch`-based GET from `$fetch`-based mutations while keeping shared request shape for `params` and `body`. Prepare Drizzle with PostgreSQL-oriented config and server-side database entrypoints without forcing a concrete schema beyond a starter example.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Tailwind CSS, ESLint, Drizzle ORM, drizzle-kit, postgres

---

### Task 1: Scaffold the Nuxt project

**Files:**
- Create: `package.json`
- Create: `nuxt.config.ts`
- Create: `app/app.vue`
- Create: `pages/index.vue`
- Create: baseline Nuxt/Tailwind/ESLint files produced by the generator

- [ ] **Step 1: Generate the Nuxt app with pnpm**

Run: `pnpm create nuxt@latest .`
Expected: Nuxt project files are created in the current directory.

- [ ] **Step 2: Install dependencies**

Run: `pnpm install`
Expected: `node_modules` and lockfile are present with no install errors.

- [ ] **Step 3: Verify the generated project builds**

Run: `pnpm build`
Expected: Nuxt production build completes successfully.

### Task 2: Reduce the app to a template-safe minimal surface

**Files:**
- Modify: `pages/index.vue`
- Modify: `app/app.vue`
- Delete or simplify: generated demo files that are not needed for the template

- [ ] **Step 1: Replace the generated page with a minimal starter page**

Write `pages/index.vue` with plain markup and scoped CSS, avoiding Tailwind classes.

- [ ] **Step 2: Ensure `app/app.vue` only renders `NuxtPage`**

Keep the app shell minimal so future template users can extend it safely.

- [ ] **Step 3: Remove generated demo assets and routes**

Delete sample content that would make the template opinionated or noisy.

- [ ] **Step 4: Run a build check**

Run: `pnpm build`
Expected: The simplified app still builds successfully.

### Task 3: Add frontend query composables

**Files:**
- Create: `composables/query/types.ts`
- Create: `composables/query/shared.ts`
- Create: `composables/query/useGet.ts`
- Create: `composables/query/usePost.ts`
- Create: `composables/query/usePut.ts`
- Create: `composables/query/usePatch.ts`
- Create: `composables/query/useDelete.ts`
- Create: `composables/query/index.ts`

- [ ] **Step 1: Define shared request and response helper types**

Include a typed request shape that supports `params`, `body`, `headers`, and pass-through fetch options.

- [ ] **Step 2: Add shared request normalization helpers**

Centralize conversion of request inputs into `query`, `body`, and fetch option objects.

- [ ] **Step 3: Implement `useGet` with `useFetch`**

Return the standard Nuxt async state while accepting shared query options and typed response generics.

- [ ] **Step 4: Implement `usePost`, `usePut`, `usePatch`, and `useDelete` with `$fetch`**

Expose callable mutation functions and request state that template users can reuse in components.

- [ ] **Step 5: Export a single barrel**

Allow imports from `~/composables/query`.

### Task 4: Add PostgreSQL Drizzle starter structure

**Files:**
- Create: `drizzle.config.ts`
- Create: `server/db/client.ts`
- Create: `server/db/schema/index.ts`
- Create: `.env.example`
- Modify: `package.json`

- [ ] **Step 1: Install Drizzle and PostgreSQL dependencies**

Run: `pnpm add drizzle-orm postgres`
Run: `pnpm add -D drizzle-kit`
Expected: runtime and dev dependencies are available.

- [ ] **Step 2: Create a PostgreSQL-oriented Drizzle config**

Point migrations to a local folder and read `DATABASE_URL` from environment.

- [ ] **Step 3: Add a server-side database client**

Create a lazy `postgres` client and wrap it with Drizzle for Nitro server usage.

- [ ] **Step 4: Add starter schema and environment example**

Provide a small placeholder schema export and `.env.example` with `DATABASE_URL`.

### Task 5: Final verification

**Files:**
- Verify: generated and modified project files

- [ ] **Step 1: Run the final build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 2: Run lint if the generated template provides it**

Run: `pnpm lint`
Expected: PASS or clear note if Nuxt generator did not include a lint script.

- [ ] **Step 3: Summarize the resulting template structure**

Call out the minimal page, query composables, and Drizzle starter files for future reuse.
