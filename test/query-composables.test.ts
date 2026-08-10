import { ref } from 'vue';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import { useDelete, useGet, usePost } from '../app/composables/query';
import type { QueryFetchOptions } from '../app/composables/query';

const mockFetch = vi.fn();
const mockUseFetch = vi.fn();

vi.stubGlobal('$fetch', mockFetch);
vi.stubGlobal('useFetch', mockUseFetch);

describe('query composables', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockUseFetch.mockReset();
    mockUseFetch.mockReturnValue({
      clear: vi.fn(),
      data: ref(undefined),
      error: ref(null),
      pending: ref(false),
      refresh: vi.fn(),
      status: ref('idle'),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps GET manual unless immediate is explicitly true', () => {
    useGet({
      url: '/api/items',
    });

    expect(mockUseFetch).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
      immediate: false,
      watch: false,
    }));

    useGet({
      immediate: true,
      url: '/api/items',
    });

    expect(mockUseFetch).toHaveBeenLastCalledWith(expect.any(Function), expect.objectContaining({
      immediate: true,
      watch: false,
    }));
  });

  it('does not let fetch options override GET execution controls', () => {
    const options = {
      immediate: true,
      watch: true,
    };

    useGet({
      options,
      url: '/api/items',
    });

    expect(mockUseFetch).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
      immediate: false,
      watch: false,
    }));
  });

  it('keeps Nuxt fetch data and retry options type-safe', () => {
    const options: QueryFetchOptions = {
      retryDelay(context) {
        return context.options.responseType === 'text' ? 100 : 0;
      },
    };
    const query = useGet<{ id: string }>({
      options,
      url: '/api/items',
    });

    expectTypeOf(query.data).toEqualTypeOf<ReturnType<typeof ref<{ id: string } | undefined>>>();
  });

  it('merges GET overrides before refreshing the reactive request', async () => {
    const data = ref<{ id: string } | undefined>();
    const refresh = vi.fn(async () => {
      data.value = {
        id: 'item-1',
      };
    });
    mockUseFetch.mockReturnValue({
      clear: vi.fn(),
      data,
      error: ref(null),
      pending: ref(false),
      refresh,
      status: ref('idle'),
    });
    const query = useGet({
      headers: {
        Authorization: 'Bearer token',
      },
      params: {
        projectId: 'project-1',
      },
      url: '/api/items',
    });
    const [
      request,
      options,
    ] = mockUseFetch.mock.calls[0] as [
      () => string,
      {
        headers: () => HeadersInit | undefined;
        query: () => Record<string, unknown> | undefined;
      },
    ];

    await expect(query.execute({
      headers: {
        'X-Request-ID': 'request-1',
      },
      params: {
        page: 2,
      },
    })).resolves.toEqual({
      id: 'item-1',
    });

    expect(refresh).toHaveBeenCalledOnce();
    expect(request()).toBe('/api/items');
    expect(options.headers()).toEqual({
      Authorization: 'Bearer token',
      'X-Request-ID': 'request-1',
    });
    expect(options.query()).toEqual({
      page: 2,
    });
  });

  it('sends params and body through POST execute', async () => {
    mockFetch.mockResolvedValue({ id: 'item-1' });
    const query = usePost({
      url: '/api/items',
    });

    await query.execute({
      body: {
        title: '새 항목',
      },
      params: {
        projectId: 'project-1',
      },
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/items', expect.objectContaining({
      body: {
        title: '새 항목',
      },
      method: 'POST',
      query: {
        projectId: 'project-1',
      },
    }));
  });

  it('sends params and a batch body through DELETE execute', async () => {
    mockFetch.mockResolvedValue(undefined);
    const query = useDelete({
      url: '/api/items',
    });

    await query.execute({
      body: {
        ids: [
          'item-1',
          'item-2',
        ],
      },
      params: {
        projectId: 'project-1',
      },
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/items', expect.objectContaining({
      body: {
        ids: [
          'item-1',
          'item-2',
        ],
      },
      method: 'DELETE',
      query: {
        projectId: 'project-1',
      },
    }));
  });
});
