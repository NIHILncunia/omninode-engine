import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import EmptyState from '../app/components/common/EmptyState.vue';
import ErrorState from '../app/components/common/ErrorState.vue';
import LoadingState from '../app/components/common/LoadingState.vue';

describe('공통 상태 UI', () => {
  it('로딩·빈 상태·오류 상태를 접근 가능한 텍스트로 렌더링한다', () => {
    expect(mount(LoadingState).text()).toContain('불러오는 중');
    expect(mount(EmptyState, { props: { title: '항목이 없습니다', }, }).text()).toContain('항목이 없습니다');
    expect(mount(ErrorState, { props: { title: '불러오지 못했습니다', }, }).text()).toContain('불러오지 못했습니다');
  });
});
