# 옴니노드 1차 라우트 골격 설계

## 목적

옴니노드의 1차 개발 범위에서 사용할 URL을 Nuxt 파일 기반 라우트로 먼저 등록한다. 이 작업은 화면 UI, 더미 데이터, API, 데이터베이스 모델을 만들지 않는다. 이후 각 주소의 기능을 독립적으로 구현할 수 있도록 주소 구조와 페이지 파일 구조만 일치시킨다.

## 범위

포함 대상은 전역, 프로젝트, 월드, 카테고리, 템플릿, 관계 타입, 설정 문서, 관계 표현의 후보 주소다. 프로젝트 기본 지침에서 1차 개발에서 제외한 문서 리비전과 토론 경로는 만들지 않는다.

각 페이지 파일은 `useSetMeta`를 호출하고, 화면에 표시되지 않는 빈 `span` 루트만 렌더링한다. 메타 제목은 주소의 기능을 설명하는 한국어 명칭으로 정한다. 페이지 콘텐츠 컴포넌트, 공통 레이아웃 변경, 내비게이션 변경은 범위 밖이다.

## 라우트 구조

Nuxt의 디렉터리와 대괄호 동적 세그먼트를 사용한다.

```text
app/pages/
├─ index.vue
├─ projects/
│  ├─ index.vue
│  ├─ new.vue
│  └─ [projectId]/
│     ├─ index.vue
│     ├─ worlds.vue
│     ├─ documents.vue
│     ├─ categories.vue
│     ├─ templates.vue
│     ├─ relations.vue
│     ├─ timeline.vue
│     ├─ search.vue
│     ├─ recent.vue
│     ├─ favorites.vue
│     ├─ activity.vue
│     ├─ trash.vue
│     ├─ settings.vue
│     └─ worlds/
│        ├─ new.vue
│        └─ [worldId]/
│           ├─ index.vue
│           ├─ categories.vue
│           ├─ templates.vue
│           ├─ documents.vue
│           ├─ relations.vue
│           ├─ relation-types.vue
│           ├─ timeline.vue
│           ├─ search.vue
│           ├─ recent.vue
│           ├─ favorites.vue
│           ├─ activity.vue
│           ├─ trash.vue
│           ├─ settings.vue
│           ├─ categories/
│           │  ├─ new.vue
│           │  └─ [categoryId]/
│           │     ├─ index.vue
│           │     ├─ documents.vue
│           │     ├─ templates.vue
│           │     └─ relations.vue
│           ├─ templates/
│           │  ├─ new.vue
│           │  └─ [templateId]/
│           │     ├─ index.vue
│           │     ├─ edit.vue
│           │     ├─ categories.vue
│           │     └─ documents.vue
│           ├─ relation-types/
│           │  ├─ new.vue
│           │  └─ [relationTypeId]/
│           │     ├─ index.vue
│           │     └─ edit.vue
│           └─ documents/
│              ├─ new.vue
│              └─ [documentId]/
│                 ├─ index.vue
│                 ├─ edit.vue
│                 ├─ relations.vue
│                 ├─ family-tree.vue
│                 └─ timeline.vue
├─ settings.vue
└─ about.vue
```

## 경계와 동작

- 라우팅은 Nuxt가 제공하는 파일 기반 규칙으로만 해결한다.
- 동적 ID는 페이지 파일에서 읽거나 검증하지 않는다. URL 파라미터 처리와 오류 화면은 실제 기능 구현 시 추가한다.
- 각 페이지의 메타 URL에는 동적 세그먼트를 그대로 기록한다. 런타임 데이터나 네트워크 요청은 발생하지 않는다.
- `hidden` 속성의 빈 `span`만 렌더링하므로 어느 라우트에서도 도메인 콘텐츠를 표시하지 않는다.

## 검증

- `pnpm exec vue-tsc --noEmit`으로 모든 SFC의 타입·자동 import 정합성을 확인한다.
- `pnpm build`로 Nuxt가 전체 파일 기반 라우트를 생성할 수 있는지 확인한다.
- 기존 전체 린트 실패가 있는 경우, 새 파일 자체의 린트 결과를 분리해 보고한다.

## 제외 사항

- 리비전, 비교, 롤백, 토론 라우트
- 페이지 화면·컴포넌트·더미 데이터
- 사이트 내비게이션·레이아웃·스타일 변경
- API, 인증, DB 스키마, 상태 관리
