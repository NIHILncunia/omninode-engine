# Agent Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a root `AGENTS.md` that establishes the Nuxt template's durable development, documentation, and verification rules.

**Architecture:** The repository root `AGENTS.md` is the mandatory operational rule surface. It holds durable rules only; feature-specific design and implementation plans live in `docs/superpowers/`, while user-provided and approved reference material lives in `references/`.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Pinia, Tailwind CSS, CVA, pnpm, Vitest, ESLint.

## Global Constraints

- A one-file change is a lightweight task; two or more changed, created, or deleted files form a non-lightweight task.
- Non-lightweight work follows brainstorming, design approval, implementation planning, implementation, and proportionate verification.
- Start a new app or feature by confirming its intended app concept with the master.
- Keep designs and implementation plans under `docs/superpowers/`.
- Keep user-supplied and master-approved future-reference Markdown under `references/`.
- Use the `app`, `server`, and `public` root layout and the approved `app/` directory structure.
- Page files compose rendering components; UI is not directly built in page files.
- Use CVA and `cn()` for rendering and UI components.
- Use Luxon for time handling when practical and name interactions `on<Action><Target>`.
- Run relevant verification before reporting completion.

---

### Task 1: Create the root operational guidance

**Files:**
- Create: `AGENTS.md`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-07-27-agent-guidance-design.md`
- Produces: Root-level instructions read before repository work.

- [x] **Step 1: Create `AGENTS.md` with durable work classification and workflow rules**

Document the one-file versus two-or-more-file threshold, the mandatory non-lightweight workflow, and the template-first concept-discovery rule.

- [x] **Step 2: Add project architecture and implementation conventions**

Document the root and `app/` directories, `*.data.ts` naming, page-to-rendering-component separation, CVA and `cn()` usage, Luxon preference, interaction naming, and Pinia state-management boundary.

- [x] **Step 3: Add documentation, verification, and Git conventions**

Document `docs/superpowers/` for design and plans, `references/` for supplied or approved reference material, proportionate test/lint/typecheck/build verification, and the master-branch Korean commit convention.

### Task 2: Verify the instruction surface

**Files:**
- Verify: `AGENTS.md`
- Verify: `docs/superpowers/specs/2026-07-27-agent-guidance-design.md`

**Interfaces:**
- Consumes: The newly created root guidance and approved design specification.
- Produces: Evidence that the final instructions cover every approved requirement without placeholder text.

- [x] **Step 1: Compare the root guidance against the approved design**

Confirm that work classification, workflow, template concept discovery, documentation paths, architecture conventions, and verification requirements appear in `AGENTS.md`.

- [x] **Step 2: Scan for incomplete instruction text**

Run: `rg -n "T[O]DO|T[B]D|추후|나중에" AGENTS.md`

Expected: no matches.

- [x] **Step 3: Check the generated documentation diff**

Run: `git diff --check -- AGENTS.md docs/superpowers`

Expected: exit code 0 with no whitespace errors.
