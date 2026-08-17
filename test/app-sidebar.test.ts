import AppSidebar from '../app/components/common/AppSidebar.vue';
import { ElMenu, ElMenuItem } from 'element-plus';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { siteConfig } from '../app/config/site.config';

describe('AppSidebar', () => {
  it('기본·관리자 레이아웃 모두 sidebar를 렌더링한다', () => {
    const adminLayout = readFileSync(resolve(process.cwd(), 'app/layouts/admin.vue'), 'utf8');
    const defaultLayout = readFileSync(resolve(process.cwd(), 'app/layouts/default.vue'), 'utf8');

    expect(adminLayout).toContain('<AppSidebar />');
    expect(adminLayout).toContain('<AdminInfoBlock class="text-white" />');
    expect(defaultLayout).toContain('<AppSidebar class="p-5" />');
  });

  it('프로젝트 메뉴만 정의하고 홈·전역 설정·소개 메뉴를 제공하지 않는다', () => {
    expect(siteConfig.navigation).toEqual([
      {
        icon: 'lucide:folder-kanban',
        label: '프로젝트',
        to: '/projects',
      },
    ]);
  });

  it('/admin은 super-admin-dashboard 레이아웃을, /docs는 기본 레이아웃을 사용한다', () => {
    const adminPage = readFileSync(resolve(process.cwd(), 'app/pages/admin/index.vue'), 'utf8');
    const docsPage = readFileSync(resolve(process.cwd(), 'app/pages/docs/index.vue'), 'utf8');

    expect(adminPage).toContain('layout: \'super-admin-dashboard\'');
    expect(docsPage).toContain('definePageMeta({ layout: \'default\', });');
  });

  it('renders every configured navigation item and emits navigate', async () => {
    const wrapper = mount(AppSidebar, {
      global: {
        components: {
          ElMenu,
          ElMenuItem,
        },
        plugins: [
          createPinia(),
        ],
        stubs: {
          Icon: true,
          UiIcon: true,
          NuxtLink: {
            props: {
              to: {
                required: true,
                type: String,
              },
            },
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    });

    for (const item of siteConfig.navigation) {
      const link = wrapper.get(`a[href="${item.to}"]`);

      expect(link.text()).toContain(item.label);
    }

    const lastNavigationItem = siteConfig.navigation.at(-1);

    if (!lastNavigationItem) {
      throw new Error('Navigation requires at least one item.');
    }

    await wrapper.get(`a[href="${lastNavigationItem.to}"]`).trigger('click');

    expect(wrapper.emitted('navigate')).toEqual([
      [
        lastNavigationItem,
      ],
    ]);
  });
});
