import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const adminRouteFiles = [
  'app/pages/signin.vue',
  'app/pages/account.vue',
  'app/pages/account/password-change.vue',
  'app/pages/admin-permission-request.vue',
  'app/pages/admin/index.vue',
  'app/pages/admins/index.vue',
  'app/pages/admins/[adminId]/index.vue',
  'app/pages/admins/[adminId]/edit.vue',
  'app/pages/projects/[projectId]/admins.vue',
] as const;

describe('관리자 라우트 골격', () => {
  it('필요한 관리자 페이지 파일을 모두 제공한다', () => {
    for (const routeFile of adminRouteFiles) {
      expect(existsSync(resolve(process.cwd(), routeFile))).toBe(true);
    }
  });

  it('이전 중첩 관리자 목록 경로를 제공하지 않는다', () => {
    expect(existsSync(resolve(process.cwd(), 'app/pages/admin/admins/index.vue'))).toBe(false);
  });

  it('모든 관리자 페이지가 메타 설정과 지정된 렌더링 루트를 가진다', () => {
    for (const routeFile of adminRouteFiles) {
      const content = readFileSync(resolve(process.cwd(), routeFile), 'utf8');

      expect(content).toContain('useSetMeta');

      if (routeFile === 'app/pages/signin.vue') {
        expect(content).toContain('<SigninForm />');
      } else if (routeFile === 'app/pages/account.vue') {
        expect(content).toContain('<AccountProfile />');
      } else if (routeFile === 'app/pages/account/password-change.vue') {
        expect(content).toContain('<PasswordChangeForm />');
      } else if (routeFile === 'app/pages/admin-permission-request.vue') {
        expect(content).toContain('<AdminPermissionRequestForm />');
      } else if (routeFile === 'app/pages/admins/index.vue') {
        expect(content).toContain('<AdminList />');
      } else if (routeFile === 'app/pages/admins/[adminId]/index.vue') {
        expect(content).toContain('<AdminDetail :admin-id="adminId" />');
      } else if (routeFile === 'app/pages/admins/[adminId]/edit.vue') {
        expect(content).toContain('<AdminEditForm :admin-id="adminId" />');
      } else if (routeFile === 'app/pages/projects/[projectId]/admins.vue') {
        expect(content).toContain('<ProjectAdminManagement');
      } else {
        expect(content).toContain('<span hidden />');
      }
    }
  });
});
