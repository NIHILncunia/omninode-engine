import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { createApp, nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useGet } from '../../../app/composables/query/useGet';

interface MountedQuery<TQuery> {
  query: TQuery;
  unmount: () => void;
}

function mountQuery<TQuery>(factory: () => TQuery): MountedQuery<TQuery> {
  const queryClient = new QueryClient();
  let query: TQuery | undefined;
  const app = createApp({
    setup() {
      query = factory();

      return () => null;
    },
  });

  app.use(VueQueryPlugin, {
    queryClient,
  });
  app.mount(document.createElement('div'));

  return {
    query: query as TQuery,
    unmount() {
      app.unmount();
      queryClient.clear();
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useGet', () => {
  it('기본 queryFn은 $fetch를 호출하고 execute는 데이터를 반환한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      list: [

      ],
    });
    vi.stubGlobal('$fetch', fetchMock);
    const mounted = mountQuery(() => useGet<{ list: string[] }>({
      url: '/api/projects',
    }));

    await expect(mounted.query.execute()).resolves.toEqual({
      list: [

      ],
    });
    await nextTick();

    expect(fetchMock).toHaveBeenCalledWith('/api/projects', expect.objectContaining({
      method: 'GET',
    }));
    expect(mounted.query.pending.value).toBe(false);
    mounted.unmount();
  });

  it('호출자 queryKey와 queryFn은 내부 기본값을 덮어쓴다', async () => {
    const queryFn = vi.fn().mockResolvedValue({
      list: [
        'custom',
      ],
    });
    const mounted = mountQuery(() => useGet<{ list: string[] }>({
      url: '/api/projects',
      queryOptions: {
        queryKey: [
          'custom-projects',
        ],
        queryFn,
        enabled: false,
      },
    }));

    await expect(mounted.query.execute()).resolves.toEqual({
      list: [
        'custom',
      ],
    });

    expect(queryFn).toHaveBeenCalledOnce();
    mounted.unmount();
  });

  it('reset은 현재 조회 상태를 초기화한다', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({
      list: [
        'project',
      ],
    }));
    const mounted = mountQuery(() => useGet<{ list: string[] }>({
      url: '/api/projects',
    }));

    await mounted.query.execute();
    mounted.query.reset();

    expect(mounted.query.data.value).toBeUndefined();
    mounted.unmount();
  });
});
