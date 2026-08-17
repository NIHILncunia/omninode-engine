import ElementPlus from 'element-plus';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiFormField from '../app/components/ui/UiFormField.vue';

describe('UiFormField', () => {
  it('레이블, 설명, 오류를 렌더링하고 class 프롭을 병합한다', () => {
    const wrapper = mount(UiFormField, {
      props: {
        label: '문서 제목',
        description: '목록과 상세에 노출됩니다.',
        error: '제목은 비워 둘 수 없습니다.',
        class: 'custom-field',
      },
      slots: {
        default: '<input name="title" />',
      },
      global: {
        plugins: [
          ElementPlus,
        ],
      },
    });

    expect(wrapper.classes()).toContain('custom-field');
    expect(wrapper.text()).toContain('문서 제목');
    expect(wrapper.text()).toContain('목록과 상세에 노출됩니다.');
    expect(wrapper.text()).toContain('제목은 비워 둘 수 없습니다.');
    expect(wrapper.get('input[name="title"]').exists()).toBe(true);
  });
});
