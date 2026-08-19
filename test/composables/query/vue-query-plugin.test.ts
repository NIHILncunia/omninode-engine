import { beforeAll, describe, expect, it, vi } from 'vitest';

let queryClientDefaultOptions: typeof import('../../../app/plugins/vue-query').queryClientDefaultOptions;

describe('Vue Query 전역 기본 옵션', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineNuxtPlugin', <TPlugin>(plugin: TPlugin) => plugin);
    ({ queryClientDefaultOptions } = await import('../../../app/plugins/vue-query'));
  });

  it('자동 재요청을 끄고 stale 및 gc 시간을 10분으로 둔다', () => {
    expect(queryClientDefaultOptions).toMatchObject({
      queries: {
        retry: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
        refetchIntervalInBackground: false,
        staleTime: 600_000,
        gcTime: 600_000,
      },
      mutations: {
        retry: false,
      },
    });
  });
});
