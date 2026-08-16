# 헤더 관리자 로그인 버튼 완료 기록

## 완료 범위

- 비로그인 상태에서 `AdminInfoBlock`이 `ElButton` 기반의 `관리자 로그인` 버튼을 표시한다.
- 버튼은 `tag="NuxtLink"`, `to="/signin"`으로 내부 인증 화면으로 이동한다.
- 기본 버튼색은 검은 헤더보다 밝은 `stone-800`이고, hover 시 `blue-500`으로 전환한다.
- 로그인 상태에서는 기존 관리자 이름·이메일 표시를 유지한다.

## 검증 근거

- TDD RED: 비로그인 버튼 라벨이 없어 `test/admin-info-block.test.ts`가 의도대로 실패했다.
- TDD GREEN: `pnpm exec vitest run test/admin-info-block.test.ts` 통과.
- 영향 범위: `test/admin-info-block.test.ts`, `test/app-sidebar.test.ts` 2개 파일·5개 테스트 통과.
- 전체: `pnpm test` 28개 파일·126개 테스트 통과.
- `pnpm lint`, `pnpm exec vue-tsc --noEmit`, `pnpm build`, `git diff --check` 통과.

## 커밋

- `ddc7267` — `2026 0817 feat: 헤더 관리자 로그인 버튼 추가`

## 후속 범위

- 푸터의 어두운 테마 전환과 전체 상용 UI 정비는 이 작업에 포함하지 않았다.
