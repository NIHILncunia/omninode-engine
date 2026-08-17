import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ElementPlus from 'element-plus';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
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

describe('UI-1 문서 탐색', () => {
  it('문서 목록은 fixture 상태 라벨을 노출하고 제목 필터를 적용한다', async () => {
    const DocumentList = await loadComponent('../app/components/docs/DocumentList.vue');

    expect(DocumentList).not.toBeNull();

    if (!DocumentList) {
      return;
    }

    const wrapper = mount(DocumentList, {
      props: {
        title: '공개 설정 문서',
        description: 'fixture 기반 문서 탐색 UI입니다.',
        documents: uiFixture.documents.filter((document) => document.status === 'PUBLIC'),
        categories: uiFixture.categories,
        selectedDocumentId: 'document-amiyu',
        getDocumentTo: (document: { id: string; worldId: string; }) => `/projects/project-yggdrasil/worlds/${document.worldId}/documents/${document.id}`,
      },
      global: {
        plugins: [
          ElementPlus,
        ],
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

    expect(wrapper.get('[data-testid="document-table"]').text()).toContain('공개');

    await wrapper.get('input[name="documentTitleQuery"]').setValue('아미유');
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('아미유');
      expect(wrapper.text()).not.toContain('중앙 기관 반란');
    });
  });

  it('문서 상세와 메타 패널은 선택 문서의 제목과 최종 수정을 보여준다', async () => {
    const DocumentDetail = await loadComponent('../app/components/docs/DocumentDetail.vue');
    const DocumentMetaPanel = await loadComponent('../app/components/docs/DocumentMetaPanel.vue');
    const document = uiFixture.documents[0];
    const world = uiFixture.worlds.find((item) => item.id === document.worldId);
    const project = uiFixture.projects.find((item) => item.worldIds.includes(document.worldId));
    const category = uiFixture.categories.find((item) => item.id === document.categoryId);

    expect(DocumentDetail).not.toBeNull();
    expect(DocumentMetaPanel).not.toBeNull();
    expect(world).toBeTruthy();
    expect(project).toBeTruthy();
    expect(category).toBeTruthy();

    if (!DocumentDetail || !DocumentMetaPanel || !world || !project || !category) {
      return;
    }

    const detailWrapper = mount(DocumentDetail, {
      props: {
        document,
        world,
        project,
        category,
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

    expect(detailWrapper.get('[data-testid="document-detail"]').text()).toContain(document.title);
    expect(metaWrapper.get('[data-testid="document-meta-panel"]').text()).toContain('최종 수정');
    expect(metaWrapper.get(`a[href="/projects/${project.id}/worlds/${world.id}/documents/${document.id}/relations"]`).text()).toContain('관계도');
  });

  it('문서 라우트는 기본 레이아웃과 문서 편집 레이아웃을 역할에 맞게 조합한다', () => {
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
    expect(projectDocumentsPage).toContain('<DocumentSidebar');
    expect(projectDocumentsPage).toContain('<DocumentList');
    expect(documentDetailPage).toContain('<DocumentDetail');
    expect(documentDetailPage).toContain('<DocumentMetaPanel');
  });
});
