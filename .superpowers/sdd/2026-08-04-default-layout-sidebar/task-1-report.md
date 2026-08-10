# Task 1 보고서

## 변경 사항

- `navigation.config.ts`에 공통 메뉴 항목과 `NavigationItem` 인터페이스를 추가했습니다.
- `AppSidebar.vue`에서 `ElMenu`, `ElMenuItem`, `NuxtLink`로 메뉴를 렌더링하고 링크 클릭 시 `navigate` 이벤트를 발생하도록 구현했습니다.
- 메뉴 렌더링 및 이벤트 계약을 검증하는 단위 테스트를 추가했습니다.

## 검증 결과

- RED: `pnpm exec vitest run test/app-sidebar.test.ts`는 `AppSidebar.vue`가 없어서 실패함을 확인했습니다.
- GREEN 시도: 동일 명령은 현재 Vitest Vue SFC 변환 설정에 `@vitejs/plugin-vue`가 없어 `.vue` 파일을 파싱하지 못해 실행되지 않습니다.
- `pnpm lint`: 기존 `app/components/index/Home.vue`의 미사용 `test` 변수 오류로 실패했습니다.
- 변경 파일 대상 ESLint: 통과했습니다.
- `pnpm exec vue-tsc --noEmit`: 통과했습니다.
- `git diff --check`: 통과했습니다.

## 우려 사항

지정된 테스트를 실행하려면 Vitest Vue SFC 변환 설정과 `@vue/test-utils` 및 DOM 환경 의존성이 필요했습니다. 마스터 승인 후 이를 Task 1 테스트 계약 범위로 보완했습니다.

## 테스트 환경 보완

- `@vitejs/plugin-vue`, `@vue/test-utils`, `happy-dom`을 개발 의존성으로 추가했습니다.
- `vitest.config.ts`에서 Vue 플러그인, `~` 별칭, `happy-dom` 환경을 설정했습니다.
- `pnpm exec vitest run test/app-sidebar.test.ts`: 1개 테스트가 통과했습니다.
- `pnpm exec nuxi typecheck`: 통과했습니다.
- 변경 파일 대상 ESLint와 `git diff --check`: 통과했습니다.

## 리뷰 보완 1차

- 테스트의 `global.components`에 실제 `ElMenu`, `ElMenuItem`을 등록하고 `Icon`을 명시 stub으로 추가했습니다.
- `navigationItems` 전체를 순회해 각 메뉴의 label과 href를 검증하고, 설정 클릭 후 `navigate` payload가 설정 항목과 일치하는지 검증했습니다.
- `element-plus`를 런타임 의존성으로 명시해 Vitest에서도 실제 Element Plus 컴포넌트를 해석하도록 했습니다.
- `pnpm exec vitest run test/app-sidebar.test.ts`: 1개 테스트가 통과했습니다.
