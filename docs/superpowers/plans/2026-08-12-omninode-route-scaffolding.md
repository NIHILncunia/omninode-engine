# 옴니노드 1차 라우트 골격 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 옴니노드 1차 개발 범위의 후보 URL을 콘텐츠 없는 Nuxt 파일 기반 페이지로 등록한다.

**Architecture:** 각 URL은 `app/pages/`의 정적 또는 동적 세그먼트 파일 하나에 대응한다. 모든 페이지는 `useSetMeta`를 호출하고 화면에 표시되지 않는 빈 `span` 루트만 유지한다. 라우트 목록 테스트는 필요한 파일이 존재하고 위키 엔진 경로가 생성되지 않았는지 검증한다.

**Tech Stack:** Nuxt 4 파일 기반 라우팅, Vue 3 SFC, TypeScript, Vitest

## Global Constraints

- UI, 더미 데이터, API, DB, 상태 관리, 레이아웃과 내비게이션은 변경하지 않는다.
- 문서 리비전·비교·토론 경로는 생성하지 않는다.
- 모든 페이지는 `useSetMeta`를 호출하고 화면에 표시되지 않는 `<span hidden />`만 둔다.
- 동적 ID는 `[projectId]`, `[worldId]`, `[categoryId]`, `[templateId]`, `[relationTypeId]`, `[documentId]` 파일명으로 나타낸다.
- 페이지 파일의 들여쓰기는 2칸을 사용한다.

---

### Task 1: 전역 및 프로젝트 범위 라우트 등록

**Files:**
- Modify: `app/pages/index.vue`
- Create: `app/pages/settings.vue`
- Create: `app/pages/about.vue`
- Create: `app/pages/projects/index.vue`
- Create: `app/pages/projects/new.vue`
- Create: `app/pages/projects/[projectId]/index.vue`
- Create: `app/pages/projects/[projectId]/{worlds,documents,categories,templates,relations,timeline,search,recent,favorites,activity,trash,settings}.vue`

**Interfaces:**
- Consumes: `useSetMeta({ title: string, url: string })` from `app/composables/useSetMeta.ts`.
- Produces: `/`, `/settings`, `/about`, `/projects`, `/projects/new`, and 프로젝트 범위의 13개 URL.

- [x] **Step 1: 비표시 페이지 형식을 적용한다.**

```vue
<script setup lang="ts">
import { useSetMeta } from '~/composables/useSetMeta.ts';

useSetMeta({
  title: '프로젝트 목록',
  url: '/projects',
});
</script>

<template>
  <span hidden />
</template>
```

- [x] **Step 2: 각 파일의 제목과 URL을 해당 주소로 설정한다.**

`/projects/:projectId` 아래 파일은 다음 URL을 사용한다.

```text
/projects/:projectId
/projects/:projectId/worlds
/projects/:projectId/documents
/projects/:projectId/categories
/projects/:projectId/templates
/projects/:projectId/relations
/projects/:projectId/timeline
/projects/:projectId/search
/projects/:projectId/recent
/projects/:projectId/favorites
/projects/:projectId/activity
/projects/:projectId/trash
/projects/:projectId/settings
```

- [x] **Step 3: 페이지 형식이 일관되는지 확인한다.**

Run: `$pages = rg --files app/pages -g '*.vue'; $missing = $pages | Where-Object { -not (Select-String -LiteralPath $_ -Pattern 'useSetMeta' -Quiet) }; if ($missing.Count -ne 0) { $missing; exit 1 }`

Expected: exit code 0이며 누락 파일 목록이 없다.

### Task 2: 월드 범위와 카테고리 라우트 등록

**Files:**
- Create: `app/pages/projects/[projectId]/worlds/new.vue`
- Create: `app/pages/projects/[projectId]/worlds/[worldId]/index.vue`
- Create: `app/pages/projects/[projectId]/worlds/[worldId]/{categories,templates,documents,relations,relation-types,timeline,search,recent,favorites,activity,trash,settings}.vue`
- Create: `app/pages/projects/[projectId]/worlds/[worldId]/categories/new.vue`
- Create: `app/pages/projects/[projectId]/worlds/[worldId]/categories/[categoryId]/{index,documents,templates,relations}.vue`

**Interfaces:**
- Consumes: Task 1의 동일한 빈 페이지 형식.
- Produces: 월드의 상위 13개 URL과 카테고리 생성·상세·하위 목록 URL.

- [x] **Step 1: 월드 상위 라우트 파일을 만든다.**

각 파일의 `url`은 `/projects/:projectId/worlds/:worldId`를 시작으로 파일명에 대응하는 경로를 붙인다. 예를 들어 `relations.vue`는 `/projects/:projectId/worlds/:worldId/relations`를 사용한다.

- [x] **Step 2: 카테고리 생성·상세·하위 라우트 파일을 만든다.**

```text
/projects/:projectId/worlds/:worldId/categories/new
/projects/:projectId/worlds/:worldId/categories/:categoryId
/projects/:projectId/worlds/:worldId/categories/:categoryId/documents
/projects/:projectId/worlds/:worldId/categories/:categoryId/templates
/projects/:projectId/worlds/:worldId/categories/:categoryId/relations
```

- [x] **Step 3: 비표시 루트 외 콘텐츠가 없는지 확인한다.**

Run: `rg -n '<(div|main|section|El[A-Z])' app/pages`

Expected: 기존 파일 외 이번에 생성한 라우트 파일에서는 결과가 없다.

### Task 3: 템플릿과 관계 타입 라우트 등록

**Files:**
- Create: `app/pages/projects/[projectId]/worlds/[worldId]/templates/new.vue`
- Create: `app/pages/projects/[projectId]/worlds/[worldId]/templates/[templateId]/{index,edit,categories,documents}.vue`
- Create: `app/pages/projects/[projectId]/worlds/[worldId]/relation-types/new.vue`
- Create: `app/pages/projects/[projectId]/worlds/[worldId]/relation-types/[relationTypeId]/{index,edit}.vue`

**Interfaces:**
- Consumes: Task 1의 빈 페이지 형식.
- Produces: 템플릿 생성·상세·편집·사용처와 관계 타입 생성·상세·편집 URL.

- [x] **Step 1: 템플릿 라우트 파일을 만든다.**

`[templateId]/index.vue`는 템플릿 상세, `edit.vue`는 템플릿 구조 편집, `categories.vue`와 `documents.vue`는 각각 사용 카테고리와 문서의 주소를 메타 URL로 설정한다.

- [x] **Step 2: 관계 타입 라우트 파일을 만든다.**

`[relationTypeId]/index.vue`와 `edit.vue`는 각각 관계 타입 상세와 수정 주소를 메타 URL로 설정한다.

- [x] **Step 3: 타입 검사를 실행한다.**

Run: `pnpm exec vue-tsc --noEmit`

Expected: exit code 0.

### Task 4: 설정 문서와 관계 표현 라우트 등록

**Files:**
- Create: `app/pages/projects/[projectId]/worlds/[worldId]/documents/new.vue`
- Create: `app/pages/projects/[projectId]/worlds/[worldId]/documents/[documentId]/{index,edit,relations,family-tree,timeline}.vue`

**Interfaces:**
- Consumes: Task 1의 빈 페이지 형식.
- Produces: 설정 문서 생성·상세·편집과 문서 중심 관계도·가계도·연표 URL.

- [x] **Step 1: 설정 문서 파일을 만든다.**

생성·상세·편집 파일의 메타 URL은 다음과 같다.

```text
/projects/:projectId/worlds/:worldId/documents/new
/projects/:projectId/worlds/:worldId/documents/:documentId
/projects/:projectId/worlds/:worldId/documents/:documentId/edit
```

- [x] **Step 2: 문서 기준 관계 표현 파일을 만든다.**

`relations.vue`, `family-tree.vue`, `timeline.vue`에 각각 문서 관계도, 문서 가계도, 문서 연표 제목과 대응 URL을 설정한다.

- [x] **Step 3: 위키 엔진 경로가 없는지 확인한다.**

Run: `rg --files app/pages | rg '(history|compare|discussion)'`

Expected: exit code 1이며 결과가 없다.

### Task 5: 라우트 목록 회귀 검증과 전체 빌드

**Files:**
- Create: `test/route-scaffolding.test.ts`

**Interfaces:**
- Consumes: Tasks 1-4에서 만든 `app/pages` 파일 51개.
- Produces: 후보 1차 경로의 파일 존재와 제외 경로 부재를 보장하는 회귀 테스트.

- [x] **Step 1: 파일 존재 테스트를 작성한다.**

```ts
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const routeFiles = [
  'app/pages/settings.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/documents/[documentId]/relations.vue',
] as const;

describe('옴니노드 1차 라우트 골격', () => {
  it('모든 대상 페이지 파일을 제공한다', () => {
    for (const routeFile of routeFiles) {
      expect(existsSync(resolve(process.cwd(), routeFile))).toBe(true);
    }
  });
});
```

목록에는 설계 문서의 51개 페이지 파일을 모두 명시한다. `history`, `compare`, `discussions` 파일은 존재하지 않는다는 별도 테스트도 추가한다.

- [x] **Step 2: 전용 테스트를 실행한다.**

Run: `pnpm test -- route-scaffolding.test.ts`

Expected: 1개 테스트 파일의 모든 테스트가 통과한다.

- [ ] **Step 3: 전체 검증을 실행한다.**

Run: `pnpm exec vue-tsc --noEmit && pnpm test && pnpm build`

Expected: 모두 exit code 0.

- [x] **Step 4: 린트를 분리 보고한다.**

Run: `pnpm exec eslint app/pages test/route-scaffolding.test.ts`

Expected: 이번에 수정·생성한 페이지 파일과 테스트 파일에 오류가 없다.
