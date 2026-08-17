import ElementPlus from 'element-plus';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { uiFixture } from '../app/data/ui-fixture.data';

const loadComponent = async <T>(modulePath: string): Promise<T | null> => {
  try {
    const module = await import(modulePath);

    return module.default as T;
  }
  catch {
    return null;
  }
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('UI-4 프로젝트 대시보드', () => {
  it('프로젝트 컨텍스트, 월드 목록, 빠른 관리 작업을 렌더링한다', async () => {
    const ProjectDashboard = await loadComponent('../app/components/project/ProjectDashboard.vue');
    const project = uiFixture.projects[0];
    const world = uiFixture.worlds.find((item) => item.projectId === project.id);

    expect(ProjectDashboard).not.toBeNull();
    expect(world).toBeDefined();

    if (!ProjectDashboard || !world) {
      return;
    }

    vi.stubGlobal('useRoute', () => ({
      params: {
        projectId: project.id,
      },
    }));

    const wrapper = mount(ProjectDashboard, {
      global: {
        plugins: [
          ElementPlus,
        ],
        stubs: {
          NuxtLink: {
            props: {
              to: String,
            },
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.get('[data-testid="project-context"]').text()).toContain(project.name);
    expect(wrapper.get('[data-testid="project-world-list"]').text()).toContain(world.name);
    expect(wrapper.get('[data-testid="project-quick-actions"]').text()).toContain('월드 생성');
  });

  it('프로젝트 관리 뷰는 로컬 생성 초안을 다이얼로그로 확인한다', async () => {
    const ProjectManagementView = await loadComponent('../app/components/project/ProjectManagementView.vue');

    expect(ProjectManagementView).not.toBeNull();

    if (!ProjectManagementView) {
      return;
    }

    vi.stubGlobal('useRoute', () => ({
      params: {},
    }));

    const wrapper = mount(ProjectManagementView, {
      props: {
        mode: 'create',
      },
      global: {
        plugins: [
          ElementPlus,
        ],
        stubs: {
          NuxtLink: {
            props: {
              to: String,
            },
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    });

    await wrapper.get('[data-testid="project-create-form"]').trigger('submit');

    expect(wrapper.text()).toContain('프로젝트 생성안 확인');
    expect(wrapper.text()).toContain('저장 없이 검토하는 로컬 초안입니다.');
  });
});
