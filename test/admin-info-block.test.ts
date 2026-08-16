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

  it('비로그인 상태에서는 관리자 로그인 버튼을 표시한다', () => {
    const auth = useAuthStore();
    auth.onSetUnauthenticated();

    const wrapper = mount(AdminInfoBlock, {
      global: {
        plugins: [
          pinia,
        ],
        stubs: {
          ElButton: {
            template: '<a :href="to"><slot /></a>',
            props: [
              'to',
              'tag',
            ],
          },
          UiIcon: {
            template: '<i :data-icon-name="iconName" />',
            props: [
              'iconName',
            ],
          },
        },
      },
    });

    expect(wrapper.text()).toContain('관리자 로그인');
    expect(wrapper.find('a').attributes('href')).toBe('/signin');
    expect(wrapper.find('[data-icon-name="lucide:settings"]').exists()).toBe(true);
    expect(wrapper.find('a').classes()).toContain('bg-stone-800!');
    expect(wrapper.find('a').classes()).toContain('hover:bg-blue-500!');
  });
});
