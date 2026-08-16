import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAuthService: vi.fn(),
}));

vi.mock('../server/services/auth.server', () => ({
  getAuthService: mocks.getAuthService,
}));

const admin = {
  id: 1,
  email: 'admin@example.com',
  name: '관리자',
  role: 'ADMIN' as const,
  passwordChangeRequired: false,
};

const session = {
  admin,
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

describe('인증 API', () => {
  const event = {} as never;
  const setCookie = vi.fn();
  const deleteCookie = vi.fn();
  const setResponseStatus = vi.fn();
  const getCookie = vi.fn();
  const readBody = vi.fn();
  const getHeader = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('defineEventHandler', <THandler>(handler: THandler): THandler => handler);
    vi.stubGlobal('setCookie', setCookie);
    vi.stubGlobal('deleteCookie', deleteCookie);
    vi.stubGlobal('setResponseStatus', setResponseStatus);
    vi.stubGlobal('getCookie', getCookie);
    vi.stubGlobal('readBody', readBody);
    vi.stubGlobal('getHeader', getHeader);
    mocks.getAuthService.mockReturnValue({
      signin: vi.fn().mockResolvedValue(session),
      refresh: vi.fn().mockResolvedValue(session),
      signout: vi.fn().mockResolvedValue(undefined),
      getAuthenticatedAdmin: vi.fn().mockResolvedValue(admin),
      changePassword: vi.fn().mockResolvedValue(session),
    });
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('signin은 관리자 DTO만 본문에 두고 두 HttpOnly 쿠키를 설정한다', async () => {
    readBody.mockResolvedValue({
      email: admin.email,
      password: 'password123',
    });
    const handler = (await import('../server/api/auth/signin.post')).default;

    await expect(handler(event)).resolves.toMatchObject({
      error: false,
      data: { admin, },
    });
    expect(setCookie).toHaveBeenNthCalledWith(1, event, 'omninode_access', 'access-token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 3600,
    });
    expect(setCookie).toHaveBeenNthCalledWith(2, event, 'omninode_refresh', 'refresh-token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/api/auth',
      maxAge: 604800,
    });
  });

  it('refresh는 refresh 쿠키로 access와 refresh를 함께 회전한다', async () => {
    getCookie.mockReturnValue('old-refresh-token');
    const handler = (await import('../server/api/auth/refresh.post')).default;

    await expect(handler(event)).resolves.toMatchObject({ data: { admin, }, });
    expect(mocks.getAuthService().refresh).toHaveBeenCalledWith({
      refreshToken: 'old-refresh-token',
      deviceInfo: undefined,
    });
    expect(setCookie).toHaveBeenCalledTimes(2);
  });

  it('me는 access 쿠키가 없으면 표준 UNAUTHORIZED 응답을 반환한다', async () => {
    getCookie.mockReturnValue(undefined);
    const handler = (await import('../server/api/auth/me.get')).default;

    await expect(handler(event)).resolves.toMatchObject({
      error: true,
      code: 'UNAUTHORIZED',
    });
    expect(setResponseStatus).toHaveBeenCalledWith(event, 401);
  });

  it('비밀번호 변경은 8자 미만 입력을 거부한다', async () => {
    getCookie.mockReturnValue('access-token');
    readBody.mockResolvedValue({
      currentPassword: 'password123',
      newPassword: 'short',
    });
    const handler = (await import('../server/api/auth/password.post')).default;

    await expect(handler(event)).resolves.toMatchObject({
      error: true,
      code: 'BAD_REQUEST',
    });
  });

  it('signout은 refresh 토큰을 폐기하고 두 쿠키를 제거한다', async () => {
    getCookie.mockReturnValue('refresh-token');
    const handler = (await import('../server/api/auth/signout.post')).default;

    await expect(handler(event)).resolves.toMatchObject({ error: false, });
    expect(mocks.getAuthService().signout).toHaveBeenCalledWith('refresh-token');
    expect(deleteCookie).toHaveBeenNthCalledWith(1, event, 'omninode_access', { path: '/', });
    expect(deleteCookie).toHaveBeenNthCalledWith(2, event, 'omninode_refresh', { path: '/api/auth', });
  });
});
