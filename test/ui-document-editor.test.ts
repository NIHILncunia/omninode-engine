import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

describe('UI-2 문서 편집', () => {
  it('문서 편집기는 저장 버튼 클릭 시 로컬 저장 준비 피드백만 갱신한다', async () => {
    const DocumentEditor = await loadComponent('../app/components/docs/DocumentEditor.vue');

    expect(DocumentEditor).not.toBeNull();

    if (!DocumentEditor) {
      return;
    }

    const fetchSpy = vi.fn();
    const document = uiFixture.documents.find((item) => item.id === 'document-amiyu');

    expect(document).toBeTruthy();

    if (!document) {
      return;
    }

    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('useRoute', () => ({
      params: {
        projectId: 'project-yggdrasil',
        worldId: 'world-luxtera',
        documentId: document.id,
      },
    }));

    const wrapper = mount(DocumentEditor, {
      props: {
        mode: 'edit',
      },
      global: {
        plugins: [
          ElementPlus,
        ],
      },
    });

    await wrapper.get('[data-testid="document-save"]').trigger('click');

    expect(wrapper.get('[data-testid="save-feedback"]').text()).toContain('저장 준비');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('취소 버튼은 edit/create 모두에서 로컬 입력값과 저장 피드백을 초기화한다', async () => {
    const DocumentEditor = await loadComponent('../app/components/docs/DocumentEditor.vue');

    expect(DocumentEditor).not.toBeNull();

    if (!DocumentEditor) {
      return;
    }

    vi.stubGlobal('useRoute', () => ({
      params: {
        projectId: 'project-yggdrasil',
        worldId: 'world-luxtera',
        documentId: 'document-amiyu',
      },
    }));

    const editWrapper = mount(DocumentEditor, {
      props: {
        mode: 'edit',
      },
      global: {
        plugins: [
          ElementPlus,
        ],
      },
    });

    await editWrapper.get('input[name="documentTitle"]').setValue('임시 제목');
    await editWrapper.get('[data-testid="document-save"]').trigger('click');
    await editWrapper.get('[data-testid="document-cancel"]').trigger('click');

    expect((editWrapper.get('input[name="documentTitle"]').element as HTMLInputElement).value).toBe('아미유');
    expect(editWrapper.get('[data-testid="save-feedback"]').text()).toContain('아직 저장 준비를 실행하지 않았습니다.');

    vi.stubGlobal('useRoute', () => ({
      params: {
        projectId: 'project-yggdrasil',
        worldId: 'world-luxtera',
      },
    }));

    const createWrapper = mount(DocumentEditor, {
      props: {
        mode: 'create',
      },
      global: {
        plugins: [
          ElementPlus,
        ],
      },
    });

    await createWrapper.get('input[name="documentTitle"]').setValue('새 문서 초안');
    await createWrapper.get('textarea').setValue('임시 요약');
    await createWrapper.get('[data-testid="document-save"]').trigger('click');
    await createWrapper.get('[data-testid="document-cancel"]').trigger('click');

    expect((createWrapper.get('input[name="documentTitle"]').element as HTMLInputElement).value).toBe('');
    expect((createWrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('');
    expect(createWrapper.get('[data-testid="save-feedback"]').text()).toContain('아직 저장 준비를 실행하지 않았습니다.');
    expect(createWrapper.get('[data-testid="document-outline"]').text()).toContain('새 설정 문서');
  });

  it('편집 모드에서는 삭제 버튼과 확인 대화상자를 제공하고 생성 모드에서는 숨긴다', async () => {
    const DocumentEditor = await loadComponent('../app/components/docs/DocumentEditor.vue');

    expect(DocumentEditor).not.toBeNull();

    if (!DocumentEditor) {
      return;
    }

    vi.stubGlobal('useRoute', () => ({
      params: {
        projectId: 'project-yggdrasil',
        worldId: 'world-luxtera',
        documentId: 'document-hati',
      },
    }));

    const editWrapper = mount(DocumentEditor, {
      props: {
        mode: 'edit',
      },
      global: {
        plugins: [
          ElementPlus,
        ],
      },
    });

    expect(editWrapper.find('[data-testid="document-delete"]').exists()).toBe(true);

    await editWrapper.get('[data-testid="document-delete"]').trigger('click');

    expect(editWrapper.text()).toContain('문서 삭제 확인');
    expect(editWrapper.text()).toContain('하티 크레실크');

    const createWrapper = mount(DocumentEditor, {
      props: {
        mode: 'create',
      },
      global: {
        plugins: [
          ElementPlus,
        ],
      },
    });

    expect(createWrapper.find('[data-testid="document-delete"]').exists()).toBe(false);
  });

  it('문서 편집기는 fixture 템플릿과 목차를 함께 보여주고 생성 모드 초깃값을 제공한다', async () => {
    const DocumentEditor = await loadComponent('../app/components/docs/DocumentEditor.vue');

    expect(DocumentEditor).not.toBeNull();
    expect(uiFixture.templates.map((template) => template.name)).toEqual(expect.arrayContaining([
      '인물 기본 템플릿',
      '도시 개요 템플릿',
    ]));

    if (!DocumentEditor) {
      return;
    }

    vi.stubGlobal('useRoute', () => ({
      params: {
        projectId: 'project-yggdrasil',
        worldId: 'world-luxtera',
      },
    }));

    const wrapper = mount(DocumentEditor, {
      props: {
        mode: 'create',
      },
      global: {
        plugins: [
          ElementPlus,
        ],
      },
    });

    expect(wrapper.get('[data-testid="document-title"]').text()).toContain('문서 제목');
    expect(wrapper.get('[data-testid="document-template"]').text()).toContain('인물 기본 템플릿');
    expect(wrapper.get('[data-testid="document-outline"]').text()).toContain('기본 정보');
    expect(wrapper.get('[data-testid="document-outline"]').text()).toContain('관계');
  });

  it('문서 생성·수정 페이지는 document-editor 레이아웃에서 편집기 모드만 조합한다', () => {
    const documentNewPage = readFileSync(
      resolve(process.cwd(), 'app/pages/projects/[projectId]/worlds/[worldId]/documents/new.vue'),
      'utf8',
    );
    const documentEditPage = readFileSync(
      resolve(process.cwd(), 'app/pages/projects/[projectId]/worlds/[worldId]/documents/[documentId]/edit.vue'),
      'utf8',
    );

    expect(documentNewPage).toContain('definePageMeta({ layout: \'document-editor\', });');
    expect(documentEditPage).toContain('definePageMeta({ layout: \'document-editor\', });');
    expect(documentNewPage).toContain('<DocumentEditor mode="create" />');
    expect(documentEditPage).toContain('<DocumentEditor mode="edit" />');

    for (const pageContent of [
      documentNewPage,
      documentEditPage,
    ]) {
      expect(pageContent).not.toContain('useRoute(');
      expect(pageContent).not.toContain('uiFixture');
      expect(pageContent).not.toContain('computed(');
      expect(pageContent).not.toContain('watch(');
    }
  });
});
