import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  createPinia,
  setActivePinia,
} from 'pinia';
import { useAuthStore } from '../app/stores/auth.store';

describe('인증 상태', () => {
  const fetchApi = vi.fn();
  const requestFetchApi = vi.fn();
  const admin = {
    id: 1,
    email: 'admin@example.com',
    name: '관리자',
    role: 'ADMIN' as const,
    passwordChangeRequired: true,
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    fetchApi.mockReset();
    requestFetchApi.mockReset();
    vi.stubGlobal('$fetch', fetchApi);
    vi.stubGlobal('useRequestFetch', () => requestFetchApi);
  });

  it('인증과 비밀번호 변경 필요 상태를 독립적으로 전이한다', () => {
    const auth = useAuthStore();

    auth.onSetAuthenticated(false);

    expect(auth.status).toBe('authenticated');
    expect(auth.passwordChangeRequired).toBe(false);

    auth.onSetPasswordChangeRequired();

    expect(auth.passwordChangeRequired).toBe(true);

    auth.onSetUnauthenticated();

    expect(auth.status).toBe('unauthenticated');
    expect(auth.passwordChangeRequired).toBe(false);
  });

  it('me 응답으로 세션을 복구하며 토큰 값을 상태에 보관하지 않는다', async () => {
    const auth = useAuthStore();
    requestFetchApi.mockResolvedValue({
      error: false,
      data: {
        admin,
      },
    });

    await expect(auth.onRestoreSession()).resolves.toBe(true);
    expect(auth.status).toBe('authenticated');
    expect(auth.admin?.email).toBe('admin@example.com');
    expect(auth.passwordChangeRequired).toBe(true);
    expect(requestFetchApi).toHaveBeenCalledWith('/api/auth/me', {
      credentials: 'include',
    });
  });

  it('access 만료 뒤 SSR 요청 fetch로 refresh와 me 재시도를 수행한다', async () => {
    const auth = useAuthStore();
    requestFetchApi
      .mockRejectedValueOnce({ status: 401, })
      .mockResolvedValueOnce({
        error: false,
        data: { admin, },
      })
      .mockResolvedValueOnce({
        error: false,
        data: { admin, },
      });

    await expect(auth.onRestoreSession()).resolves.toBe(true);
    expect(requestFetchApi).toHaveBeenNthCalledWith(1, '/api/auth/me', {
      credentials: 'include',
    });
    expect(requestFetchApi).toHaveBeenNthCalledWith(2, '/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    expect(requestFetchApi).toHaveBeenNthCalledWith(3, '/api/auth/me', {
      credentials: 'include',
    });
    expect(auth.status).toBe('authenticated');
    expect(auth.admin).toEqual(admin);
  });

  it('access와 refresh가 모두 거부되면 비인증 상태로 전환한다', async () => {
    const auth = useAuthStore();
    requestFetchApi
      .mockRejectedValueOnce({ status: 401, })
      .mockRejectedValueOnce({ status: 401, });

    await expect(auth.onRestoreSession()).resolves.toBe(false);
    expect(auth.status).toBe('unauthenticated');
    expect(auth.admin).toBeNull();
  });

  it('401 이외의 세션 확인 오류에서는 기존 인증 상태를 지우지 않는다', async () => {
    const auth = useAuthStore();
    auth.onSetAuthenticated(false, admin);
    requestFetchApi.mockRejectedValueOnce({ status: 500, });

    await expect(auth.onRestoreSession()).rejects.toMatchObject({ status: 500, });
    expect(auth.status).toBe('authenticated');
    expect(auth.admin).toEqual(admin);
  });

  it('로그인과 로그아웃은 쿠키 기반 API만 호출한다', async () => {
    const auth = useAuthStore();
    fetchApi
      .mockResolvedValueOnce({
        error: false,
        data: {
          admin: {
            id: 1,
            email: 'admin@example.com',
            name: '관리자',
            role: 'ADMIN',
            passwordChangeRequired: false,
          },
        },
      })
      .mockResolvedValueOnce({
        error: false,
        data: null,
      });

    await expect(auth.onSignin('admin@example.com', 'password123')).resolves.toBe(true);
    await auth.onSignOut();

    expect(fetchApi).toHaveBeenNthCalledWith(1, '/api/auth/signin', {
      method: 'POST',
      credentials: 'include',
      body: {
        email: 'admin@example.com',
        password: 'password123',
      },
    });
    expect(fetchApi).toHaveBeenNthCalledWith(2, '/api/auth/signout', {
      method: 'POST',
      credentials: 'include',
    });
    expect(auth.status).toBe('unauthenticated');
  });
});
