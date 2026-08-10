# 사이트 푸터 설정 설계

## 목적

사이트별 서비스 시작 연도와 외부 소셜 링크를 `siteConfig`에서 관리하고, 기본 레이아웃 푸터가 이를 자동 표시한다.

## 설정 구조

- `siteConfig.site.startedYear`는 서비스 시작 연도를 숫자로 보관한다.
- `siteConfig.links`는 `icon`, `link`, `label`을 가진 객체 배열이다.
- 각 객체는 Iconify 아이콘 이름, 외부 URL, 접근 가능한 링크 레이블을 보관한다.
- GitHub, X, YouTube, Instagram 등 필요한 서비스는 배열 항목으로 자유롭게 추가하거나 제거한다.

## 푸터 동작

- 현재 연도는 Luxon `DateTime.now().year`로 계산한다.
- 시작 연도와 현재 연도가 같으면 `© 시작연도 사이트명`을, 다르면 `© 시작연도–현재연도 사이트명`을 표시한다.
- 저작권 표기 앞에는 Iconify 저작권 아이콘을 둔다.
- 사이트 URL 및 `siteConfig.links` 항목을 새 탭 링크로 표시한다.
- 각 외부 링크는 해당 객체의 Iconify 아이콘과 접근 가능한 레이블을 사용한다.

## 범위와 검증

- 변경 대상은 `app/types/common.types.ts`, `app/config/site.config.ts`, `app/layouts/default.vue`다.
- 푸터의 현재 연도와 URL 노출 조건을 테스트하고, 변경 파일 린트와 Nuxt 빌드를 실행한다.
