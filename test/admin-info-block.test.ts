import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import AdminInfoBlock from '../app/components/common/AdminInfoBlock.vue';
import { useAuthStore } from '../app/stores/auth.store';

describe('AdminInfoBlock', () => {
  let pinia: Pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  it('로그인한 관리자의 이메일과 이름을 표시한다', () => {
    const auth = useAuthStore();
    auth.onSetAuthenticated(false, {
      id: 1,
      email: 'admin@example.com',
      name: '관리자',
      role: 'SUPER_ADMIN',
      passwordChangeRequired: false,
    });

    const wrapper = mount(AdminInfoBlock, {
      global: {
        plugins: [
          pinia,
        ],
        stubs: {
          UiIcon: true,
        },
      },
    });

    expect(wrapper.text()).toContain('admin@example.com');
    expect(wrapper.text()).toContain('관리자');
  });

  it('비로그인 상태에서는 관리자 정보를 렌더링하지 않는다', () => {
    const auth = useAuthStore();
    auth.onSetUnauthenticated();

    const wrapper = mount(AdminInfoBlock, {
      global: {
        plugins: [
          pinia,
        ],
        stubs: {
          UiIcon: true,
        },
      },
    });

    expect(wrapper.find('div').exists()).toBe(false);
  });
});
