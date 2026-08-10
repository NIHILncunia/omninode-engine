# 기본 레이아웃과 사이드바 설계

## 목적

사이드바를 기본 제공하는 Nuxt 앱 셸을 만든다. 데스크톱에서는 고정 사이드바를 보여 주고, 모바일에서는 기본적으로 숨긴 뒤 메뉴 버튼으로 열 수 있게 한다. 개별 앱이 사이드바가 필요 없으면 해당 레이아웃 요소를 제거해 사용한다.

## Element Plus 구성

- 최상위 앱 셸은 `ElContainer`와 `ElHeader`, `ElAside`, `ElMain`, `ElFooter`로 구성한다.
- 모바일 사이드바는 `ElDrawer`를 사용한다.
- 데스크톱과 모바일 Drawer 안의 메뉴는 같은 `ElMenu` 기반 `AppSidebar` 컴포넌트를 재사용한다.
- 메뉴 아이콘은 Nuxt Icon의 Iconify 이름을 사용한다.

## 화면 구조

```text
Desktop
Header
└─ 브랜드 링크 · 사용자 영역 슬롯

Content
├─ Aside: 272px, 기본 메뉴
└─ Main: 페이지 본문만 세로 스크롤

Footer
└─ 외부 링크 · 저작권

Mobile
Header
├─ 메뉴 버튼
└─ 브랜드 링크

Main
└─ 페이지 본문

Drawer
└─ AppSidebar
```

## 상태와 메뉴

- `useAppStore().isSidebarOpen`은 모바일 Drawer의 열림 상태만 보관한다.
- 데스크톱 `ElAside`는 `md` 이상에서 항상 표시한다.
- 모바일에서는 `ElAside`를 렌더링하지 않고 `ElDrawer`만 사용한다.
- 메뉴는 `app/config/navigation.config.ts`에서 `label`, `to`, `icon`으로 관리한다.
- 기본 메뉴는 대시보드(`/`), 문서(`/docs`), 설정(`/settings`)으로 제공한다.
- 메뉴 링크를 누르면 모바일 Drawer를 닫는다.

## 컴포넌트 경계

- `app/components/common/AppSidebar.vue`: `ElMenu`와 설정 기반 메뉴를 렌더링한다.
- `app/components/common/AppHeader.vue`: 메뉴 버튼, 브랜드 링크, 우측 슬롯을 렌더링한다.
- `app/layouts/default.vue`: 앱 셸 배치, responsive Aside/Drawer, Main, Footer만 담당한다.
- `app/config/navigation.config.ts`: 기본 메뉴 데이터만 제공한다.

## 반응형과 접근성

- 모바일 헤더의 메뉴 버튼은 `aria-label="메뉴 열기"`를 가진다.
- Drawer의 제목은 `메뉴`이며 닫기 제어를 제공한다.
- 본문은 `min-w-0`, `min-h-0`, `overflow-y-auto`로 독립 스크롤한다.
- 푸터는 모바일에서 세로, `sm` 이상에서는 가로 배치한다.

## 검증

- Pinia 상태로 Drawer가 열리고 닫히는지 테스트한다.
- 기본 메뉴의 링크·라벨·아이콘을 테스트한다.
- 레이아웃에 데스크톱 Aside와 모바일 Drawer가 모두 존재하는지 테스트한다.
- 변경 파일 lint, Nuxt typecheck, 전체 test, build를 실행한다.
