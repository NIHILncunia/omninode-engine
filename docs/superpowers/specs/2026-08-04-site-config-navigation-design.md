# 사이트 설정 내비게이션 통합 설계

## 목적

내비게이션을 별도 설정 파일이 아닌 사이트 설정의 일부로 관리한다. 외부 링크와 같은 객체 배열 형태를 유지해 사이트의 공통 탐색 정보를 한 곳에서 확인할 수 있게 한다.

## 구조

- `NavigationItem`은 `label`, `to`, `icon` 필드를 가진다.
- `SiteConfig`에 `navigation: NavigationItem[]`을 추가한다.
- `siteConfig.navigation`이 대시보드, 문서, 설정 항목을 제공한다.
- `AppSidebar`와 관련 테스트는 `siteConfig.navigation`만 참조한다.
- 역할이 끝난 `app/config/navigation.config.ts`는 제거한다.

## 완료 기준

- 사이드바가 사이트 설정의 모든 내비게이션 항목을 렌더링한다.
- 기존 메뉴 이동 이벤트 동작이 유지된다.
- 기존 전용 내비게이션 설정 파일을 참조하는 코드가 없다.
