import { describe, expect, it, vi } from 'vitest';

import { createDefaultQueryKey, executeFetch, mergeQueryInput } from '../../../app/composables/query/shared';

describe('query 요청 공통 함수', () => {
  it('기본 조회 키에 메서드, URL, 파라미터를 넣는다', () => {
    expect(createDefaultQueryKey('/api/projects', {
      page: 2,
    })).toEqual([
      'GET',
      '/api/projects',
      {
        page: 2,
      },
    ]);
  });

  it('execute override 헤더는 기존 헤더와 병합한다', () => {
    expect(mergeQueryInput({
      url: '/api/projects',
      headers: {
        authorization: 'Bearer old',
      },
    }, {
      headers: {
        'x-request-id': 'request-1',
      },
    })).toMatchObject({
      headers: {
        authorization: 'Bearer old',
        'x-request-id': 'request-1',
      },
    });
  });

  it('기본 요청 함수는 정규화된 요청을 $fetch로 전달한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      id: 1,
    });

    vi.stubGlobal('$fetch', fetchMock);

    await expect(executeFetch<{ id: number }>({
      url: '/api/projects/1',
      method: 'PATCH',
      query: {
        draft: true,
      },
      body: {
        name: '수정',
      },
      headers: {
        'x-request-id': 'request-1',
      },
      fetchOptions: {
        credentials: 'include',
      },
    })).resolves.toEqual({
      id: 1,
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/projects/1', {
      method: 'PATCH',
      query: {
        draft: true,
      },
      body: {
        name: '수정',
      },
      headers: {
        'x-request-id': 'request-1',
      },
      credentials: 'include',
    });
  });
});
