import { describe, expect, it } from 'vitest';

import { buildFetchRequestOptions, createMutationState, createQueryResult, mergeQueryInput, normalizeApiError, normalizeRequestInput } from '../app/composables/query/shared';

function createDeferred<TData>() {
  let resolve: (value: TData) => void;

  const promise = new Promise<TData>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return {
    promise,
    resolve: (value: TData) => resolve(value),
  };
}

describe('normalizeRequestInput', () => {
  it('keeps params and body together with merged headers', () => {
    const normalized = normalizeRequestInput('POST', {
      params: {
        page: 2,
        keyword: 'nuxt',
      },
      body: { title: 'entry' },
      headers: { Authorization: 'Bearer token' },
      options: { credentials: 'include' },
    });

    expect(normalized.method).toBe('POST');
    expect(normalized.query).toEqual({
      page: 2,
      keyword: 'nuxt',
    });
    expect(normalized.body).toEqual({ title: 'entry' });
    expect(normalized.headers).toEqual({ Authorization: 'Bearer token' });
    expect(normalized.fetchOptions).toMatchObject({ credentials: 'include' });
  });

  it('omits body when it is not provided', () => {
    const normalized = normalizeRequestInput('GET', {
      params: { page: 1 },
    });

    expect(normalized.method).toBe('GET');
    expect(normalized.query).toEqual({ page: 1 });
    expect(normalized.body).toBeUndefined();
  });
});

describe('buildFetchRequestOptions', () => {
  it('returns query, body, and fetch overrides in a single object', () => {
    const normalized = normalizeRequestInput('PATCH', {
      params: { id: 7 },
      body: { active: true },
      options: { credentials: 'same-origin' },
    });

    expect(buildFetchRequestOptions(normalized)).toMatchObject({
      method: 'PATCH',
      query: { id: 7 },
      body: { active: true },
      credentials: 'same-origin',
    });
  });
});

describe('createMutationState', () => {
  it('starts with an idle mutation state', () => {
    const state = createMutationState<number, Error>();

    expect(state.pending.value).toBe(false);
    expect(state.data.value).toBeUndefined();
    expect(state.error.value).toBeNull();
  });
});

describe('mergeQueryInput', () => {
  it('keeps an explicitly supplied null body when merging mutation overrides', () => {
    const merged = mergeQueryInput(
      {
        url: '/api/items',
        body: {
          ids: [
            'item-1',
          ],
        },
      },
      {
        body: null,
      },
    );

    expect(merged.body).toBeNull();
  });

  it('merges default and override record headers', () => {
    const merged = mergeQueryInput(
      {
        url: '/api/items',
        headers: {
          Authorization: 'Bearer token',
        },
      },
      {
        headers: {
          'X-Request-ID': 'request-1',
        },
      },
    );

    expect(merged.headers).toEqual({
      Authorization: 'Bearer token',
      'X-Request-ID': 'request-1',
    });
  });
});

describe('createQueryResult', () => {
  it('keeps pending true until concurrent executions have all settled', async () => {
    const first = createDeferred<number>();
    const second = createDeferred<number>();
    const query = createQueryResult(async ({ id }: { id: number }) => {
      return id === 1 ? await first.promise : await second.promise;
    });

    const firstExecution = query.execute({ id: 1 });
    const secondExecution = query.execute({ id: 2 });

    expect(query.pending.value).toBe(true);
    first.resolve(1);
    await firstExecution;
    expect(query.pending.value).toBe(true);
    second.resolve(2);
    await secondExecution;
    expect(query.pending.value).toBe(false);
    expect(query.status.value).toBe('success');
  });

  it('resets query data, errors, and status', async () => {
    const query = createQueryResult(async () => 1);

    await query.execute();
    query.reset();

    expect(query.data.value).toBeUndefined();
    expect(query.error.value).toBeNull();
    expect(query.status.value).toBe('idle');
  });

  it('keeps pending true after reset until an active execution settles', async () => {
    const deferred = createDeferred<number>();
    const query = createQueryResult(async () => await deferred.promise);
    const execution = query.execute();

    query.reset();

    expect(query.pending.value).toBe(true);
    expect(query.status.value).toBe('idle');
    deferred.resolve(1);
    await execution;
    expect(query.pending.value).toBe(false);
  });

  it('keeps the last settled successful result after an earlier request fails', async () => {
    const first = createDeferred<undefined>();
    const second = createDeferred<number>();
    const query = createQueryResult(async ({ id }: { id: number }) => {
      if (id === 1) {
        await first.promise;
        throw new Error('First request failed');
      }

      return await second.promise;
    });

    const firstExecution = query.execute({ id: 1 });
    const secondExecution = query.execute({ id: 2 });

    first.resolve(undefined);
    await expect(firstExecution).rejects.toMatchObject({
      message: 'First request failed',
    });
    expect(query.error.value).not.toBeNull();
    second.resolve(2);
    await secondExecution;

    expect(query.data.value).toBe(2);
    expect(query.error.value).toBeNull();
    expect(query.status.value).toBe('success');
  });

  it('normalizes failed executions before storing the error', async () => {
    const cause = {
      data: { code: 'INVALID_INPUT' },
      message: 'Invalid input',
      statusCode: 400,
    };
    const query = createQueryResult(async () => {
      throw cause;
    });

    await expect(query.execute()).rejects.toEqual(normalizeApiError(cause));
    expect(query.error.value).toEqual({
      cause,
      data: { code: 'INVALID_INPUT' },
      message: 'Invalid input',
      statusCode: 400,
    });
    expect(query.status.value).toBe('error');
  });
});
