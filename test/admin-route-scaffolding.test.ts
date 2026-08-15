import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const adminRouteFiles = [
  'app/pages/signin.vue',
  'app/pages/account.vue',
  'app/pages/account/password-change.vue',
  'app/pages/admin/index.vue',
  'app/pages/admin/admins/index.vue',
  'app/pages/admin/admins/new.vue',
  'app/pages/admin/admins/[adminId]/index.vue',
  'app/pages/admin/admins/[adminId]/edit.vue',
  'app/pages/admin/admins/[adminId]/permissions.vue',
  'app/pages/admin/permissions.vue',
  'app/pages/projects/[projectId]/admins.vue',
] as const;

describe('관리자 라우트 골격', () => {
  it('필요한 관리자 페이지 파일을 모두 제공한다', () => {
    for (const routeFile of adminRouteFiles) {
      expect(existsSync(resolve(process.cwd(), routeFile))).toBe(true);
    }
  });

  it('모든 관리자 페이지가 메타 설정과 비표시 루트를 가진다', () => {
    for (const routeFile of adminRouteFiles) {
      const content = readFileSync(resolve(process.cwd(), routeFile), 'utf8');

      expect(content).toContain('useSetMeta');
      expect(content).toContain('<span hidden />');
    }
  });
});
