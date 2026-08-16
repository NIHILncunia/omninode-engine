import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.stubGlobal('defineNuxtRouteMiddleware', <T>(middleware: T): T => middleware);

const { getAuthRedirect, } = await import('../app/middleware/auth.global');

describe('인증 보호 경로', () => {
  it('비동기 세션 복원 미들웨어를 Nuxt 라우트 미들웨어로 선언한다', () => {
    const middleware = readFileSync(
      resolve(process.cwd(), 'app/middleware/auth.global.ts'),
      'utf8',
    );

    expect(middleware).toContain('export default defineNuxtRouteMiddleware(async to => {');
  });

  it('SSR event context의 인증 관리자로 store를 초기화한다', () => {
    const middleware = readFileSync(
      resolve(process.cwd(), 'app/middleware/auth.global.ts'),
      'utf8',
    );

    expect(middleware).toContain('if (import.meta.server) {');
    expect(middleware).toContain('useRequestEvent()?.context.authenticatedAdmin');
  });

  it('공개 경로는 인증되지 않아도 통과시킨다', () => {
    expect(getAuthRedirect('/signin', 'unauthenticated', false)).toBeNull();
    expect(getAuthRedirect('/docs', 'unauthenticated', false)).toBeNull();
  });

  it('인증되지 않은 보호 경로 접근을 로그인으로 보낸다', () => {
    expect(getAuthRedirect('/projects', 'unauthenticated', false)).toBe('/signin');
  });

  it('비밀번호 변경이 필요한 관리자를 변경 화면으로 보낸다', () => {
    expect(getAuthRedirect('/projects', 'authenticated', true)).toBe('/account/password-change');
  });
});
