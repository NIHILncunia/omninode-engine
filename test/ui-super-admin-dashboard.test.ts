import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ElementPlus from 'element-plus';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

const loadComponent = async <T>(modulePath: string): Promise<T | null> => {
  try {
    const module = await import(modulePath);

    return module.default as T;
  }
  catch {
    return null;
  }
};

const nuxtLinkStub = {
  props: {
    to: {
      required: true,
      type: String,
    },
  },
  template: '<a :href="to"><slot /></a>',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('UI-3 슈퍼 어드민 대시보드', () => {
  it('전역 KPI와 최근 문서 목록을 렌더링하고 숨김 문서를 redaction한다', async () => {
    const SuperAdminDashboard = await loadComponent('../app/components/admin/SuperAdminDashboard.vue');

    expect(SuperAdminDashboard).not.toBeNull();

    if (!SuperAdminDashboard) {
      return;
    }

    vi.stubGlobal('useRoute', () => ({
      params: {},
      query: {},
    }));

    const wrapper = mount(SuperAdminDashboard, {
      global: {
        plugins: [
          ElementPlus,
        ],
        stubs: {
          NuxtLink: nuxtLinkStub,
        },
      },
    });

    expect(wrapper.get('[data-testid="system-kpi"]').text()).toContain('전체 프로젝트');

    const recentDocuments = wrapper.get('[data-testid="recent-documents"]').text();

    expect(recentDocuments).toContain('숨김');
    expect(recentDocuments).toContain('숨김 문서');
    expect(recentDocuments).toContain('비공개 카테고리');
    expect(recentDocuments).not.toContain('숨겨진 중계탑');
  });

  it('관리자 관리 뷰는 fixture 기반 관리자 테이블을 제공한다', async () => {
    const AdminManagementView = await loadComponent('../app/components/admin/AdminManagementView.vue');

    expect(AdminManagementView).not.toBeNull();

    if (!AdminManagementView) {
      return;
    }

    vi.stubGlobal('useRoute', () => ({
      params: {},
      query: {},
    }));

    const wrapper = mount(AdminManagementView, {
      props: {
        mode: 'list',
      },
      global: {
        plugins: [
          ElementPlus,
        ],
        stubs: {
          NuxtLink: nuxtLinkStub,
        },
      },
    });

    expect(wrapper.get('[data-testid="admin-table"]').findAll('tr').length).toBeGreaterThan(1);

  });

  it('관리자 수정 초안은 저장 없이 로컬 dialog로만 확인한다', async () => {
    const AdminManagementView = await loadComponent('../app/components/admin/AdminManagementView.vue');

    expect(AdminManagementView).not.toBeNull();

    if (!AdminManagementView) {
      return;
    }

    vi.stubGlobal('useRoute', () => ({
      params: {
        adminId: 'admin-master',
      },
      query: {},
    }));

    const wrapper = mount(AdminManagementView, {
      props: {
        mode: 'edit',
      },
      global: {
        plugins: [
          ElementPlus,
        ],
        stubs: {
          NuxtLink: nuxtLinkStub,
        },
      },
    });

    await wrapper.get('[data-testid="admin-edit-form"] form').trigger('submit');

    expect(wrapper.text()).toContain('변경안 확인');
    expect(wrapper.text()).toContain('저장 없이 검토하는 로컬 변경안입니다.');
  });

  it('슈퍼 어드민 라우트는 super-admin-dashboard 레이아웃과 렌더링 컴포넌트만 조합한다', () => {
    const adminPage = readFileSync(resolve(process.cwd(), 'app/pages/admin/index.vue'), 'utf8');
    const adminsPage = readFileSync(resolve(process.cwd(), 'app/pages/admins/index.vue'), 'utf8');
    const adminDetailPage = readFileSync(resolve(process.cwd(), 'app/pages/admins/[adminId]/index.vue'), 'utf8');
    const adminEditPage = readFileSync(resolve(process.cwd(), 'app/pages/admins/[adminId]/edit.vue'), 'utf8');

    for (const pageContent of [
      adminPage,
      adminsPage,
      adminDetailPage,
      adminEditPage,
    ]) {
      expect(pageContent).toContain('layout: \'super-admin-dashboard\'');
      expect(pageContent).toContain('middleware: \'super-admin\'');
      expect(pageContent).not.toContain('useRoute(');
      expect(pageContent).not.toContain('uiFixture');
      expect(pageContent).not.toContain('watch(');
      expect(pageContent).not.toContain('computed(');
    }

    expect(adminPage).toContain('<SuperAdminDashboard />');
    expect(adminsPage).toContain('<AdminManagementView />');
    expect(adminDetailPage).toContain('<AdminManagementView mode="detail" />');
    expect(adminEditPage).toContain('<AdminManagementView mode="edit" />');
  });
});
