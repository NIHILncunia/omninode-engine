import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ElementPlus from 'element-plus';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DocumentDetail from '../app/components/docs/DocumentDetail.vue';
import DocumentList from '../app/components/docs/DocumentList.vue';
import DocumentMetaPanel from '../app/components/docs/DocumentMetaPanel.vue';
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

describe('UI-1 문서 탐색', () => {
  it('전역 공개 문서 route view는 표시 문서 전체의 카테고리 옵션을 목록에 전달한다', async () => {
    const DocumentExplorerRouteView = await loadComponent('../app/components/docs/DocumentExplorerRouteView.vue');

    expect(DocumentExplorerRouteView).not.toBeNull();

    if (!DocumentExplorerRouteView) {
      return;
    }

    vi.stubGlobal('useRoute', () => ({
      params: {},
      query: {},
    }));

    const wrapper = mount(DocumentExplorerRouteView, {
      props: {
        scope: 'public',
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

    const list = wrapper.getComponent(DocumentList);
    const categoryNames = list.props('categories').map((category: { name: string; }) => category.name);

    expect(categoryNames).toEqual(expect.arrayContaining([
      '인물',
      '사건',
    ]));
  });

  it('문서 목록은 카테고리 선택, 상태 선택, 제목 필터를 함께 적용한다', async () => {
    const wrapper = mount(DocumentList, {
      props: {
        title: '전체 문서',
        description: 'fixture 기반 문서 탐색 UI입니다.',
        documents: uiFixture.documents,
        categories: uiFixture.categories,
        selectedDocumentId: 'document-amiyu',
        getDocumentTo: (document: { id: string; worldId: string; }) => `/projects/project-yggdrasil/worlds/${document.worldId}/documents/${document.id}`,
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

    expect(wrapper.get('[data-testid="document-table"]').text()).toContain('공개');
    expect(wrapper.text()).toContain('현재 결과 6건');

    const selects = wrapper.findAllComponents({ name: 'ElSelect', });

    selects[0]?.vm.$emit('update:modelValue', 'category-character');
    selects[1]?.vm.$emit('update:modelValue', 'DRAFT');
    await wrapper.get('input[name="documentTitleQuery"]').setValue('하티');

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('현재 결과 1건');
      expect(wrapper.text()).toContain('하티 크레실크');
      expect(wrapper.text()).not.toContain('아미유');
    });
  });

  it('문서 목록 route view는 query state를 loading/empty/error 모드로 고정한다', async () => {
    const DocumentExplorerRouteView = await loadComponent('../app/components/docs/DocumentExplorerRouteView.vue');

    expect(DocumentExplorerRouteView).not.toBeNull();

    if (!DocumentExplorerRouteView) {
      return;
    }

    for (const state of [
      'loading',
      'empty',
      'error',
    ] as const) {
      vi.stubGlobal('useRoute', () => ({
        params: {},
        query: {
          state,
        },
      }));

      const wrapper = mount(DocumentExplorerRouteView, {
        props: {
          scope: 'public',
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

      expect(wrapper.getComponent(DocumentList).props('mode')).toBe(state);
      expect(wrapper.getComponent(DocumentMetaPanel).props('mode')).toBe(state);
    }
  });

  it('문서 상세 route view는 query state를 본문과 메타 패널에 같은 모드로 전달한다', async () => {
    const DocumentDetailRouteView = await loadComponent('../app/components/docs/DocumentDetailRouteView.vue');

    expect(DocumentDetailRouteView).not.toBeNull();

    if (!DocumentDetailRouteView) {
      return;
    }

    for (const state of [
      'loading',
      'empty',
      'error',
    ] as const) {
      vi.stubGlobal('useRoute', () => ({
        params: {
          projectId: 'project-yggdrasil',
          worldId: 'world-luxtera',
          documentId: 'document-amiyu',
        },
        query: {
          state,
        },
      }));

      const wrapper = mount(DocumentDetailRouteView, {
        global: {
          plugins: [
            ElementPlus,
          ],
          stubs: {
            NuxtLink: nuxtLinkStub,
          },
        },
      });

      expect(wrapper.getComponent(DocumentDetail).props('mode')).toBe(state);
      expect(wrapper.getComponent(DocumentMetaPanel).props('mode')).toBe(state);
    }
  });

  it('문서 상세와 메타 패널은 선택 문서의 제목과 최종 수정을 보여주고 상세도 상태 패널을 지원한다', () => {
    const document = uiFixture.documents[0];
    const world = uiFixture.worlds.find((item) => item.id === document.worldId);
    const project = uiFixture.projects.find((item) => item.worldIds.includes(document.worldId));
    const category = uiFixture.categories.find((item) => item.id === document.categoryId);

    expect(world).toBeTruthy();
    expect(project).toBeTruthy();
    expect(category).toBeTruthy();

    if (!world || !project || !category) {
      return;
    }

    const detailWrapper = mount(DocumentDetail, {
      props: {
        document,
        world,
        project,
        category,
        mode: 'ready',
      },
      global: {
        plugins: [
          ElementPlus,
        ],
      },
    });

    const metaWrapper = mount(DocumentMetaPanel, {
      props: {
        document,
        world,
        project,
        category,
        mode: 'ready',
        relatedRoutes: [
          {
            label: '관계도',
            to: `/projects/${project.id}/worlds/${world.id}/documents/${document.id}/relations`,
          },
        ],
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

    expect(detailWrapper.get('[data-testid="document-detail"]').text()).toContain(document.title);
    expect(metaWrapper.get('[data-testid="document-meta-panel"]').text()).toContain('최종 수정');
    expect(metaWrapper.get(`a[href="/projects/${project.id}/worlds/${world.id}/documents/${document.id}/relations"]`).text()).toContain('관계도');

    const loadingDetailWrapper = mount(DocumentDetail, {
      props: {
        document,
        world,
        project,
        category,
        mode: 'loading',
      },
      global: {
        plugins: [
          ElementPlus,
        ],
      },
    });

    expect(loadingDetailWrapper.text()).toContain('문서를 불러오는 중입니다');
  });

  it('문서 라우트는 기본 레이아웃과 문서 편집 레이아웃을 역할에 맞게 조합하고 page 로직을 렌더링 컴포넌트로 위임한다', () => {
    const docsPage = readFileSync(resolve(process.cwd(), 'app/pages/docs/index.vue'), 'utf8');
    const projectDocumentsPage = readFileSync(resolve(process.cwd(), 'app/pages/projects/[projectId]/documents.vue'), 'utf8');
    const worldDocumentsPage = readFileSync(resolve(process.cwd(), 'app/pages/projects/[projectId]/worlds/[worldId]/documents.vue'), 'utf8');
    const categoryDocumentsPage = readFileSync(resolve(process.cwd(), 'app/pages/projects/[projectId]/worlds/[worldId]/categories/[categoryId]/documents.vue'), 'utf8');
    const documentDetailPage = readFileSync(resolve(process.cwd(), 'app/pages/projects/[projectId]/worlds/[worldId]/documents/[documentId]/index.vue'), 'utf8');
    const documentNewPage = readFileSync(resolve(process.cwd(), 'app/pages/projects/[projectId]/worlds/[worldId]/documents/new.vue'), 'utf8');
    const documentEditPage = readFileSync(resolve(process.cwd(), 'app/pages/projects/[projectId]/worlds/[worldId]/documents/[documentId]/edit.vue'), 'utf8');

    expect(docsPage).toContain('definePageMeta({ layout: \'default\', });');
    expect(projectDocumentsPage).toContain('definePageMeta({ layout: \'default\', });');
    expect(worldDocumentsPage).toContain('definePageMeta({ layout: \'default\', });');
    expect(categoryDocumentsPage).toContain('definePageMeta({ layout: \'default\', });');
    expect(documentDetailPage).toContain('definePageMeta({ layout: \'default\', });');
    expect(documentNewPage).toContain('definePageMeta({ layout: \'document-editor\', });');
    expect(documentEditPage).toContain('definePageMeta({ layout: \'document-editor\', });');
    expect(docsPage).toContain('<DocumentExplorerRouteView scope="public" />');
    expect(projectDocumentsPage).toContain('<DocumentExplorerRouteView scope="project" />');
    expect(worldDocumentsPage).toContain('<DocumentExplorerRouteView scope="world" />');
    expect(categoryDocumentsPage).toContain('<DocumentExplorerRouteView scope="category" />');
    expect(documentDetailPage).toContain('<DocumentDetailRouteView />');

    for (const pageContent of [
      docsPage,
      projectDocumentsPage,
      worldDocumentsPage,
      categoryDocumentsPage,
      documentDetailPage,
    ]) {
      expect(pageContent).not.toContain('useRoute(');
      expect(pageContent).not.toContain('uiFixture');
      expect(pageContent).not.toContain('watch(');
      expect(pageContent).not.toContain('computed(');
    }
  });
});
