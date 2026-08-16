import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ElementPlus from 'element-plus';
import SigninForm from '../app/components/auth/SigninForm.vue';
import PasswordChangeForm from '../app/components/auth/PasswordChangeForm.vue';

describe('인증 UI', () => {
  const fetchApi = vi.fn();

  beforeEach(() => {
    setActivePinia(createPinia());
    fetchApi.mockReset();
    vi.stubGlobal('$fetch', fetchApi);
    vi.stubGlobal('navigateTo', vi.fn());
  });

  it('로그인 실패를 오류 상태로 표시한다', async () => {
    fetchApi.mockRejectedValue(new Error('unauthorized'));
    const wrapper = mount(SigninForm, {
      global: {
        plugins: [
          createPinia(),
          ElementPlus,
        ],
      },
    });

    expect(wrapper.findComponent({ name: 'ElForm', }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'ElForm', }).props('labelPosition')).toBe('top');
    await wrapper.get('input[name="email"]').setValue('admin@example.com');
    await wrapper.get('input[name="password"]').setValue('password123');
    await wrapper.get('form').trigger('submit');
    await vi.waitFor(() => expect(wrapper.text()).toContain('로그인하지 못했습니다.'));
  });

  it('비밀번호 변경이 필요 없는 로그인은 어드민 대시보드로 이동한다', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    fetchApi.mockResolvedValue({
      error: false,
      data: {
        admin: {
          id: 1,
          email: 'admin@example.com',
          name: '관리자',
          role: 'SUPER_ADMIN',
          passwordChangeRequired: false,
        },
      },
    });
    const wrapper = mount(SigninForm, {
      global: {
        plugins: [
          pinia,
          ElementPlus,
        ],
      },
    });

    await wrapper.get('input[name="email"]').setValue('admin@example.com');
    await wrapper.get('input[name="password"]').setValue('password123');
    await wrapper.get('form').trigger('submit');

    await vi.waitFor(() => expect(navigateTo).toHaveBeenCalledWith('/admin'));
  });

  it('8자 미만 새 비밀번호는 변경 요청을 보내지 않는다', async () => {
    const wrapper = mount(PasswordChangeForm, {
      global: {
        plugins: [
          createPinia(),
          ElementPlus,
        ],
      },
    });

    expect(wrapper.findComponent({ name: 'ElForm', }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'ElForm', }).props('labelPosition')).toBe('top');
    await wrapper.get('input[name="currentPassword"]').setValue('password123');
    await wrapper.get('input[name="newPassword"]').setValue('short');
    await wrapper.get('form').trigger('submit');

    expect(fetchApi).not.toHaveBeenCalled();
  });
});
