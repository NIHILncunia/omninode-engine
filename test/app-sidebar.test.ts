import AppSidebar from '../app/components/common/AppSidebar.vue';
import { ElMenu, ElMenuItem } from 'element-plus';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { siteConfig } from '../app/config/site.config';

describe('AppSidebar', () => {
  it('defines navigation items in the site configuration', () => {
    expect(siteConfig.navigation.length).toBeGreaterThan(0);

    for (const item of siteConfig.navigation) {
      expect(item).not.toHaveProperty('icon');
    }
  });

  it('renders every configured navigation item and emits navigate', async () => {
    const wrapper = mount(AppSidebar, {
      global: {
        components: {
          ElMenu,
          ElMenuItem,
        },
        stubs: {
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
