import AppSidebar from '../app/components/common/AppSidebar.vue';
import { ElMenu, ElMenuItem } from 'element-plus';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { siteConfig } from '../app/config/site.config';

describe('AppSidebar', () => {
  it('기본 레이아웃이 sidebar를 렌더링한다', () => {
    const layout = readFileSync(resolve(process.cwd(), 'app/layouts/default.vue'), 'utf8');

    expect(layout).toContain('<AppSidebar />');
    expect(layout).toContain('<AdminInfoBlock class="text-white" />');
  });

  it('defines navigation items with suitable icons in the site configuration', () => {
    expect(siteConfig.navigation.length).toBeGreaterThan(0);

    for (const item of siteConfig.navigation) {
      expect(item.icon).toBeTruthy();
    }
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
