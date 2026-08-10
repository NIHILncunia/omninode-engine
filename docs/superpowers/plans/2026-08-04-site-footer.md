# 사이트 푸터 설정 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사이트 설정의 시작 연도와 외부 링크 배열을 이용해 기본 레이아웃에 자동 저작권 표기와 Iconify 링크를 표시한다.

**Architecture:** `SiteConfig`에 숫자 시작 연도와 링크 객체 배열을 정의하고, `siteConfig`가 실제 입력값을 제공한다. `default.vue`는 Luxon으로 현재 연도를 계산해 저작권 문자열을 만들고, 설정 배열을 순회해 외부 링크만 렌더링한다.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Luxon, Nuxt Icon, Element Plus

## Global Constraints

- 시작 연도는 `siteConfig.site.startedYear`의 숫자 값이다.
- 외부 링크는 `icon`, `link`, `label` 객체 배열로 관리한다.
- 아이콘은 Iconify 이름을 사용하고, 외부 링크는 새 탭과 `rel="noopener noreferrer"`로 연다.
- 현재 연도는 Luxon `DateTime.now().year`로 계산한다.
- 커밋과 푸시는 마스터가 별도로 요청할 때만 수행한다.

---

### Task 1: 사이트 설정 계약 확장

**Files:**
- Modify: `app/types/common.types.ts:35-66`
- Modify: `app/config/site.config.ts:3-35`

**Interfaces:**
- Produces: `SiteLink` 타입 `{ icon: string; link: string; label: string }`
- Produces: `SiteConfig.site.startedYear: number` 및 `SiteConfig.links: SiteLink[]`

- [ ] **Step 1: 시작 연도와 링크 배열 타입 추가**

```ts
export interface SiteLink {
  icon: string;
  link: string;
  label: string;
}
```

`SiteConfig.site`에 `startedYear: number`를, 최상위 `SiteConfig`에 `links: SiteLink[]`를 추가한다.

- [ ] **Step 2: 기본 사이트 설정에 입력 예시 추가**

```ts
site: {
  startedYear: 2026,
},
links: [
  {
    icon: 'mdi:github',
    link: 'https://github.com/nihilncunia',
    label: 'GitHub',
  },
],
```

- [ ] **Step 3: 타입 계약 확인**

Run: `pnpm exec vue-tsc --noEmit`

Expected: `SiteConfig`와 `siteConfig`의 새 속성이 타입 오류 없이 일치한다.

### Task 2: 기본 레이아웃 푸터 렌더링

**Files:**
- Modify: `app/layouts/default.vue:1-24`

**Interfaces:**
- Consumes: `siteConfig.site.startedYear`, `siteConfig.site.title`, `siteConfig.site.url`, `siteConfig.links`
- Produces: 자동 계산된 저작권 표기와 설정 기반 외부 링크 푸터

- [ ] **Step 1: 현재 연도와 저작권 표기 계산 추가**

```ts
const currentYear = DateTime.now().year;
const copyrightYears = currentYear === siteConfig.site.startedYear
  ? String(siteConfig.site.startedYear)
  : `${siteConfig.site.startedYear}–${currentYear}`;
```

- [ ] **Step 2: Iconify 저작권 아이콘과 외부 링크 푸터 구현**

```vue
<ElFooter>
  <div>
    <Icon name="mdi:copyright" />
    <a :href="siteConfig.site.url" target="_blank" rel="noopener noreferrer">
      {{ copyrightYears }} {{ siteConfig.site.title }}
    </a>
  </div>
  <nav aria-label="외부 링크">
    <a
      v-for="siteLink in siteConfig.links"
      :key="siteLink.link"
      :href="siteLink.link"
      :aria-label="siteLink.label"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon :name="siteLink.icon" />
    </a>
  </nav>
</ElFooter>
```

- [ ] **Step 3: 변경 범위 검증**

Run: `pnpm exec eslint app/layouts/default.vue app/config/site.config.ts app/types/common.types.ts && pnpm build`

Expected: 대상 파일 린트와 Nuxt 프로덕션 빌드가 모두 성공한다.
