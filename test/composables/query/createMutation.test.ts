import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { createApp } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMutation } from '../../../app/composables/query/createMutation';
import { usePost } from '../../../app/composables/query/usePost';

function mountMutation<TMutation>(factory: () => TMutation) {
  const queryClient = new QueryClient();
  let mutation: TMutation | undefined;
  const app = createApp({
    setup() {
      mutation = factory();

      return () => null;
    },
  });

  app.use(VueQueryPlugin, {
    queryClient,
  });
  app.mount(document.createElement('div'));

  return {
    mutation: mutation as TMutation,
    unmount() {
      app.unmount();
      queryClient.clear();
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createMutation', () => {
  it.each([
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
  ] as const)('%s 요청에 body, params, fetchOptions를 전달한다', async (method) => {
    const fetchMock = vi.fn().mockResolvedValue({
      id: 1,
    });
    vi.stubGlobal('$fetch', fetchMock);
    const mounted = mountMutation(() => createMutation<{ id: number }, {
      name: string;
    }>(method, {
      url: '/api/projects/1',
      params: {
        draft: true,
      },
      body: {
        name: '수정',
      },
      fetchOptions: {
        credentials: 'include',
      },
    }));

    await expect(mounted.mutation.execute()).resolves.toEqual({
      id: 1,
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/1', expect.objectContaining({
      method,
      body: {
        name: '수정',
      },
      query: {
        draft: true,
      },
      credentials: 'include',
    }));
    mounted.unmount();
  });

  it('사용자 mutationFn과 onSuccess가 기본 요청보다 우선한다', async () => {
    const mutationFn = vi.fn().mockResolvedValue({
      id: 2,
    });
    const onSuccess = vi.fn();
    const mounted = mountMutation(() => usePost<{ id: number }, {
      name: string;
    }>({
      url: '/api/projects',
      mutationOptions: {
        mutationFn,
        onSuccess,
      },
    }));

    await expect(mounted.mutation.execute({
      body: {
        name: '사용자 정의',
      },
    })).resolves.toEqual({
      id: 2,
    });
    expect(mutationFn).toHaveBeenCalledWith(expect.objectContaining({
      body: {
        name: '사용자 정의',
      },
    }), expect.any(Object));
    expect(onSuccess).toHaveBeenCalledOnce();
    mounted.unmount();
  });
});
