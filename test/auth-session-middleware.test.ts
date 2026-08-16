import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
  restoreRequestAdmin: vi.fn(),
  sendRedirect: vi.fn(),
}));

vi.mock('../server/utils/auth-session', () => ({
  restoreRequestAdmin: mocks.restoreRequestAdmin,
}));

describe('SSR 인증 보호 미들웨어', () => {
  beforeEach(() => {
    mocks.restoreRequestAdmin.mockReset();
    mocks.sendRedirect.mockReset();
    vi.stubGlobal('defineEventHandler', <THandler>(handler: THandler): THandler => handler);
    vi.stubGlobal('sendRedirect', mocks.sendRedirect);
  });

  it('보호 페이지의 복원된 관리자를 요청 context에 보관한다', async () => {
    const admin = {
      id: 1,
      email: 'admin@example.com',
      name: '관리자',
      role: 'ADMIN' as const,
      passwordChangeRequired: false,
    };
    const event = {
      path: '/admin',
      context: {},
    } as never;
    mocks.restoreRequestAdmin.mockResolvedValue(admin);
    const { default: middleware, } = await import('../server/middleware/00.auth-session');

    await middleware(event);

    expect(mocks.restoreRequestAdmin).toHaveBeenCalledWith(event);
    expect(event.context.authenticatedAdmin).toEqual(admin);
    expect(mocks.sendRedirect).not.toHaveBeenCalled();
  });

  it('인증되지 않은 보호 페이지 요청을 signin으로 보낸다', async () => {
    const event = {
      path: '/admin',
      context: {},
    } as never;
    mocks.restoreRequestAdmin.mockResolvedValue(null);
    const { default: middleware, } = await import('../server/middleware/00.auth-session');

    await middleware(event);

    expect(mocks.sendRedirect).toHaveBeenCalledWith(event, '/signin');
  });

  it('공개와 정적 경로에서는 인증 복원을 시도하지 않는다', async () => {
    const event = {
      path: '/_nuxt/app.js',
      context: {},
    } as never;
    const { default: middleware, } = await import('../server/middleware/00.auth-session');

    await middleware(event);

    expect(mocks.restoreRequestAdmin).not.toHaveBeenCalled();
  });
});
