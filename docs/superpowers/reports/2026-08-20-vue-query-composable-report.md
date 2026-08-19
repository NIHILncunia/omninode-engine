# Vue Query 공통 컴포저블 완료 리포트

## 완료 범위

- Nuxt 전역 QueryClient와 Vue Query 플러그인을 등록했다.
- 조회·변경 기본 요청을 `$fetch`로 통일했다.
- 기존 `useGet`, `usePost`, `usePut`, `usePatch`, `useDelete`, `pending`, `execute()` 호출을 유지했다.
- `queryOptions`, `mutationOptions`, `fetchOptions`를 분리하고, 호출자 옵션이 기본 키·함수·전역 기본값을 덮어쓰도록 구현했다.
- 모든 기본 재시도·자동 재요청을 비활성화하고 `staleTime`, `gcTime`을 각각 10분으로 설정했다.

## 검증 근거

- `pnpm exec vitest run test/composables/query`: 4개 파일, 12개 테스트 통과
- `pnpm exec eslint app/plugins/vue-query.ts app/composables/query test/composables/query`: 통과
- `pnpm lint`: 통과
- `pnpm exec vue-tsc --noEmit`: 통과
- `pnpm build`: 통과
- `git diff --check`: 통과

## 전체 테스트 상태

`pnpm test`는 Vue Query 대상 12개를 포함해 15개 테스트가 통과했지만, 기존 `test/database-schema.test.ts`의 `uq_world_admins_world_id_admin_id` 복합 UNIQUE 제약 기대 1건이 실패했다. 이 실패는 Vue Query 변경 파일과 무관하며, 단계 2.5 관리자 CRUD 점검에서 별도로 다룬다.

## 커밋

- `583d57b` `2026 0820 feat: Vue Query 전역 설정 추가`
- `02d507d` `2026 0820 refactor: 쿼리 요청 타입과 공통 함수 전환`
- `4e00c0f` `2026 0820 refactor: GET 컴포저블을 Vue Query로 전환`
- `2e03366` `2026 0820 refactor: 변경 컴포저블을 Vue Query로 전환`
- `f7b791f` `2026 0820 test: Vue Query 테스트 스타일 정합화`

## 후속 범위

- 도메인별 API 조회 성공 데이터를 해당 Pinia store에 동기화하는 작업은 실제 도메인 UI·API 수직 슬라이스에서 구현한다.
- 전체 테스트를 막는 `world_admins` 복합 UNIQUE 제약 불일치는 관리자 CRUD 점검 범위에서 원인과 기대 계약을 분리해 정정한다.
