import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readLayout = (layoutName: string): string => readFileSync(
  resolve(process.cwd(), `app/layouts/${layoutName}.vue`),
  'utf8',
);

describe('UI-0 layouts', () => {
  it('문서 편집 레이아웃은 문서 사이드바와 협소 화면 드로어를 사용한다', () => {
    const documentLayout = readLayout('document-editor');

    expect(documentLayout).toContain('<DocumentSidebar');
    expect(documentLayout).toContain('<ElDrawer');
    expect(documentLayout).toContain('<AppHeader');
  });

  it('대시보드 계열 레이아웃은 공통 대시보드 사이드바를 사용한다', () => {
    const superAdminLayout = readLayout('super-admin-dashboard');
    const projectLayout = readLayout('project-dashboard');
    const worldLayout = readLayout('world-dashboard');

    expect(superAdminLayout).toContain('<DashboardSidebar');
    expect(projectLayout).toContain('<DashboardSidebar');
    expect(worldLayout).toContain('<DashboardSidebar');
  });

  it('헤더와 본문을 세로로 배치해 헤더가 전체 폭을 사용한다', () => {
    for (const layoutName of [
      'default',
      'document-editor',
      'super-admin-dashboard',
      'project-dashboard',
      'world-dashboard',
    ]) {
      expect(readLayout(layoutName)).toContain('<ElContainer direction="vertical"');
    }
  });

  it('기본·인증 레이아웃은 밝은 UI 기반을 따르며 auth에는 사이드바가 없다', () => {
    const defaultLayout = readLayout('default');
    const authLayout = readLayout('auth');

    expect(defaultLayout).toContain('<AppHeader');
    expect(defaultLayout).toContain('bg-black-50');
    expect(authLayout).not.toContain('<AppSidebar');
    expect(authLayout).toContain('bg-black-50');
  });
});
