import { uiFixture, type UiFixtureCategory, type UiFixtureDocument, type UiFixtureProject, type UiFixtureWorld } from '~/data/ui-fixture.data';

export type DocumentViewMode = 'ready' | 'loading' | 'empty' | 'error';
export type DocumentExplorerScope = 'public' | 'project' | 'world' | 'category';

export interface RelatedRouteItem {
  label: string;
  to: string;
}

interface RouteLike {
  params: Record<string, unknown>;
  query: Record<string, unknown>;
}

export interface DocumentExplorerContext {
  title: string;
  description: string;
  documents: UiFixtureDocument[];
  categories: UiFixtureCategory[];
  defaultSidebarWorldId: string;
  getDocumentTo: (document: UiFixtureDocument) => string;
}

export interface DocumentDetailContext {
  project: UiFixtureProject;
  world: UiFixtureWorld;
  document: UiFixtureDocument | null;
  category: UiFixtureCategory | null;
  relatedRoutes: RelatedRouteItem[];
}

export const normalizeRouteParam = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }

  return typeof value === 'string' ? value : undefined;
};

export const resolveDocumentViewMode = (query: Record<string, unknown>): DocumentViewMode => {
  const state = normalizeRouteParam(query.state);

  if (state === 'loading' || state === 'empty' || state === 'error') {
    return state;
  }

  return 'ready';
};

const findProject = (projectId?: string): UiFixtureProject => uiFixture.projects.find((project) => project.id === projectId) ?? uiFixture.projects[0]!;
const findWorld = (worldId?: string, project?: UiFixtureProject): UiFixtureWorld => uiFixture.worlds.find((world) => world.id === worldId)
  ?? uiFixture.worlds.find((world) => world.projectId === project?.id)
  ?? uiFixture.worlds[0]!;
const findCategory = (categoryId?: string, world?: UiFixtureWorld): UiFixtureCategory => uiFixture.categories.find((category) => category.id === categoryId)
  ?? uiFixture.categories.find((category) => category.worldId === world?.id)
  ?? uiFixture.categories[0]!;

const categoriesForDocuments = (documents: UiFixtureDocument[]): UiFixtureCategory[] => {
  const categoryIds = new Set(documents.map((document) => document.categoryId));

  return uiFixture.categories.filter((category) => categoryIds.has(category.id));
};

export const buildDocumentExplorerContext = (scope: DocumentExplorerScope, route: RouteLike): DocumentExplorerContext => {
  if (scope === 'public') {
    const documents = uiFixture.documents.filter((document) => document.status === 'PUBLIC');
    const categories = categoriesForDocuments(documents);

    return {
      title: '공개 설정 문서',
      description: '공개 상태의 fixture 문서를 프로젝트·월드 상세로 이어지는 경로와 함께 미리 확인합니다.',
      documents,
      categories,
      defaultSidebarWorldId: documents[0]?.worldId ?? uiFixture.worlds[0]!.id,
      getDocumentTo: (document) => {
        const world = findWorld(document.worldId);
        const project = findProject(world.projectId);

        return `/projects/${project.id}/worlds/${document.worldId}/documents/${document.id}`;
      },
    };
  }

  if (scope === 'project') {
    const project = findProject(normalizeRouteParam(route.params.projectId));
    const documents = uiFixture.documents.filter((document) => project.worldIds.includes(document.worldId));

    return {
      title: `${project.name} 문서`,
      description: '프로젝트에 포함된 모든 월드의 문서를 하나의 fixture 목록으로 묶어 탐색합니다.',
      documents,
      categories: uiFixture.categories.filter((category) => project.worldIds.includes(category.worldId)),
      defaultSidebarWorldId: project.worldIds[0] ?? uiFixture.worlds[0]!.id,
      getDocumentTo: (document) => `/projects/${project.id}/worlds/${document.worldId}/documents/${document.id}`,
    };
  }

  if (scope === 'world') {
    const project = findProject(normalizeRouteParam(route.params.projectId));
    const world = findWorld(normalizeRouteParam(route.params.worldId), project);
    const documents = uiFixture.documents.filter((document) => document.worldId === world.id);

    return {
      title: `${world.name} 문서`,
      description: '현재 월드에 속한 문서를 카테고리·상태 조건으로 걸러서 확인합니다.',
      documents,
      categories: uiFixture.categories.filter((category) => category.worldId === world.id),
      defaultSidebarWorldId: world.id,
      getDocumentTo: (document) => `/projects/${project.id}/worlds/${world.id}/documents/${document.id}`,
    };
  }

  const project = findProject(normalizeRouteParam(route.params.projectId));
  const world = findWorld(normalizeRouteParam(route.params.worldId), project);
  const category = findCategory(normalizeRouteParam(route.params.categoryId), world);
  const documents = uiFixture.documents.filter((document) => document.categoryId === category.id);

  return {
    title: `${category.name} 문서`,
    description: '특정 카테고리에 속한 fixture 문서를 선택하고 상세 페이지 경로로 이어집니다.',
    documents,
    categories: uiFixture.categories.filter((item) => item.worldId === world.id),
    defaultSidebarWorldId: world.id,
    getDocumentTo: (document) => `/projects/${project.id}/worlds/${world.id}/documents/${document.id}`,
  };
};

export const buildDocumentExplorerRelatedRoutes = (
  scope: DocumentExplorerScope,
  document: UiFixtureDocument | null,
  project: UiFixtureProject | null,
  world: UiFixtureWorld | null,
  category: UiFixtureCategory | null,
): RelatedRouteItem[] => {
  if (!document || !project || !world) {
    return [
    ];
  }

  if (scope === 'public') {
    return [
      {
        label: '문서 상세',
        to: `/projects/${project.id}/worlds/${world.id}/documents/${document.id}`,
      },
      {
        label: '월드 문서',
        to: `/projects/${project.id}/worlds/${world.id}/documents`,
      },
    ];
  }

  if (scope === 'project') {
    return [
      {
        label: '월드 문서',
        to: `/projects/${project.id}/worlds/${world.id}/documents`,
      },
      {
        label: '문서 상세',
        to: `/projects/${project.id}/worlds/${world.id}/documents/${document.id}`,
      },
    ];
  }

  if (scope === 'world') {
    return [
      {
        label: '문서 상세',
        to: `/projects/${project.id}/worlds/${world.id}/documents/${document.id}`,
      },
      {
        label: '카테고리 문서',
        to: category
          ? `/projects/${project.id}/worlds/${world.id}/categories/${category.id}/documents`
          : `/projects/${project.id}/worlds/${world.id}/documents`,
      },
    ];
  }

  return [
    {
      label: '월드 문서',
      to: `/projects/${project.id}/worlds/${world.id}/documents`,
    },
    {
      label: '문서 상세',
      to: `/projects/${project.id}/worlds/${world.id}/documents/${document.id}`,
    },
  ];
};

export const buildDocumentDetailContext = (route: RouteLike): DocumentDetailContext => {
  const project = findProject(normalizeRouteParam(route.params.projectId));
  const world = findWorld(normalizeRouteParam(route.params.worldId), project);
  const documentId = normalizeRouteParam(route.params.documentId);
  const document = uiFixture.documents.find((item) => item.id === documentId && item.worldId === world.id)
    ?? uiFixture.documents.find((item) => item.worldId === world.id)
    ?? null;
  const category = uiFixture.categories.find((item) => item.id === document?.categoryId) ?? null;

  return {
    project,
    world,
    document,
    category,
    relatedRoutes: document
      ? [
        {
          label: '월드 문서',
          to: `/projects/${project.id}/worlds/${world.id}/documents`,
        },
        {
          label: '카테고리 문서',
          to: category
            ? `/projects/${project.id}/worlds/${world.id}/categories/${category.id}/documents`
            : `/projects/${project.id}/worlds/${world.id}/documents`,
        },
        {
          label: '관계도',
          to: `/projects/${project.id}/worlds/${world.id}/documents/${document.id}/relations`,
        },
      ]
      : [
      ],
  };
};
