import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
const routeFiles = [
  'app/pages/index.vue',
  'app/pages/docs/index.vue',
  'app/pages/settings.vue',
  'app/pages/about.vue',
  'app/pages/projects/index.vue',
  'app/pages/projects/new.vue',
  'app/pages/projects/[projectId]/index.vue',
  'app/pages/projects/[projectId]/worlds.vue',
  'app/pages/projects/[projectId]/documents.vue',
  'app/pages/projects/[projectId]/categories.vue',
  'app/pages/projects/[projectId]/templates.vue',
  'app/pages/projects/[projectId]/relations.vue',
  'app/pages/projects/[projectId]/timeline.vue',
  'app/pages/projects/[projectId]/search.vue',
  'app/pages/projects/[projectId]/recent.vue',
  'app/pages/projects/[projectId]/favorites.vue',
  'app/pages/projects/[projectId]/activity.vue',
  'app/pages/projects/[projectId]/trash.vue',
  'app/pages/projects/[projectId]/settings.vue',
  'app/pages/projects/[projectId]/worlds/new.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/index.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/categories.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/templates.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/documents.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/relations.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/relation-types.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/timeline.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/search.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/recent.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/favorites.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/activity.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/trash.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/settings.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/categories/new.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/categories/[categoryId]/index.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/categories/[categoryId]/documents.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/categories/[categoryId]/templates.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/categories/[categoryId]/relations.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/templates/new.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/templates/[templateId]/index.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/templates/[templateId]/edit.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/templates/[templateId]/categories.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/templates/[templateId]/documents.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/relation-types/new.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/relation-types/[relationTypeId]/index.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/relation-types/[relationTypeId]/edit.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/documents/new.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/documents/[documentId]/index.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/documents/[documentId]/edit.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/documents/[documentId]/relations.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/documents/[documentId]/family-tree.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/documents/[documentId]/timeline.vue',
] as const;
const excludedRouteFiles = [
  'app/pages/projects/[projectId]/worlds/[worldId]/documents/[documentId]/history.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/documents/[documentId]/compare.vue',
  'app/pages/projects/[projectId]/worlds/[worldId]/documents/[documentId]/discussions.vue',
] as const;

const renderedRouteViews = [
  {
    routeFile: 'app/pages/projects/index.vue',
    component: '<ProjectManagementView mode="list" />',
  },
  {
    routeFile: 'app/pages/projects/new.vue',
    component: '<ProjectManagementView mode="create" />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/index.vue',
    component: '<ProjectDashboard />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/worlds.vue',
    component: '<ProjectManagementView mode="worlds" />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/settings.vue',
    component: '<ProjectManagementView mode="settings" />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/categories.vue',
    component: '<ProjectManagementView section-description="월드별 카테고리 구조를 관리하기 위한 프로젝트 범위 진입 화면입니다." section-title="프로젝트 카테고리" mode="derived" />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/templates.vue',
    component: '<ProjectManagementView section-description="월드별 문서 템플릿을 프로젝트 범위에서 탐색합니다." section-title="프로젝트 템플릿" mode="derived" />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/relations.vue',
    component: '<ProjectManagementView section-description="월드 간 문서 관계를 프로젝트 범위에서 탐색하는 화면입니다." section-title="문서 관계" mode="derived" />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/timeline.vue',
    component: '<ProjectManagementView section-description="프로젝트 범위의 시간 정보와 문서 변경을 탐색합니다." section-title="프로젝트 타임라인" mode="derived" />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/search.vue',
    component: '<ProjectManagementView section-description="프로젝트에 속한 월드와 문서를 탐색할 수 있는 작업 화면입니다." section-title="프로젝트 검색" mode="derived" />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/recent.vue',
    component: '<ProjectManagementView section-description="프로젝트 범위의 최근 접근 문서를 fixture 기준으로 표시합니다." section-title="최근 문서" mode="derived" />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/favorites.vue',
    component: '<ProjectManagementView section-description="프로젝트 범위에서 빠르게 다시 열 문서를 모아 확인합니다." section-title="즐겨찾기" mode="derived" />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/activity.vue',
    component: '<ProjectManagementView section-description="프로젝트 안의 최근 변경 흐름을 fixture 기준으로 검토합니다." section-title="프로젝트 활동" mode="derived" />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/trash.vue',
    component: '<ProjectManagementView section-description="삭제·보관 상태의 항목을 프로젝트 범위에서 검토합니다." section-title="휴지통" mode="derived" />',
  },
  {
    routeFile: 'app/pages/docs/index.vue',
    component: '<DocumentExplorerRouteView scope="public" />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/documents.vue',
    component: '<DocumentExplorerRouteView scope="project" />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/worlds/[worldId]/documents.vue',
    component: '<DocumentExplorerRouteView scope="world" />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/worlds/[worldId]/categories/[categoryId]/documents.vue',
    component: '<DocumentExplorerRouteView scope="category" />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/worlds/[worldId]/documents/new.vue',
    component: '<DocumentEditor mode="create" />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/worlds/[worldId]/documents/[documentId]/index.vue',
    component: '<DocumentDetailRouteView />',
  },
  {
    routeFile: 'app/pages/projects/[projectId]/worlds/[worldId]/documents/[documentId]/edit.vue',
    component: '<DocumentEditor mode="edit" />',
  },
] as const;

describe('옴니노드 1차 라우트 골격', () => {
  it('모든 대상 페이지 파일을 제공한다', () => {
    for (const routeFile of routeFiles) {
      expect(existsSync(resolve(process.cwd(), routeFile))).toBe(true);
    }
  });
  it('대상 페이지가 메타 설정과 지정된 루트를 포함한다', () => {
    for (const routeFile of routeFiles) {
      const content = readFileSync(resolve(process.cwd(), routeFile), 'utf8');
      expect(content).toContain('useSetMeta');

      if (routeFile === 'app/pages/index.vue') {
        expect(content).toContain('await navigateTo(\'/docs\', { replace: true, });');
        continue;
      }

      const renderedRouteView = renderedRouteViews.find((item) => item.routeFile === routeFile);

      if (renderedRouteView) {
        expect(content).toContain(renderedRouteView.component);
      } else {
        expect(content).toContain('<span hidden />');
      }
    }
  });
  it('리비전과 토론 라우트 파일을 생성하지 않는다', () => {
    for (const routeFile of excludedRouteFiles) {
      expect(existsSync(resolve(process.cwd(), routeFile))).toBe(false);
    }
  });
});
