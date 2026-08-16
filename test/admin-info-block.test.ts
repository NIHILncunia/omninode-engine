import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminInfoBlock from '../app/components/common/AdminInfoBlock.vue';
import { useAuthStore } from '../app/stores/auth.store';

describe('AdminInfoBlock', () => {
  let pinia: Pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.stubGlobal('navigateTo', vi.fn());
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

  it('비로그인 상태에서 관리자 로그인 버튼을 누르면 로그인 화면으로 이동한다', async () => {
    const auth = useAuthStore();
    auth.onSetUnauthenticated();

    const wrapper = mount(AdminInfoBlock, {
      global: {
        plugins: [
          pinia,
        ],
        stubs: {
          ElButton: {
            template: '<button><slot /></button>',
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
    expect(wrapper.find('[data-icon-name="lucide:settings"]').exists()).toBe(true);
    expect(wrapper.find('button').classes()).toContain('bg-stone-800!');
    expect(wrapper.find('button').classes()).toContain('hover:bg-blue-500!');

    await wrapper.get('button').trigger('click');

    expect(navigateTo).toHaveBeenCalledWith('/signin');
  });
});
