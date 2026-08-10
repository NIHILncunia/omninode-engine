import { computed, ref, shallowRef } from 'vue';
import type { Ref } from 'vue';

import type { ApiError, MutationResult, MutationState, NormalizedRequest, QueryBaseInput, QueryBody, QueryFetchOptions, QueryHeaders, QueryMethod, QueryParams, QueryRequestInput, QueryResult, QueryStatus } from './types';

interface QueryState<TData> {
  data: QueryResult<TData, never>['data'];
  error: QueryResult<TData, never>['error'];
  status: QueryResult<TData, never>['status'];
  pending: QueryResult<TData, never>['pending'];
}

function isPlainHeaders(
  headers: QueryHeaders | undefined,
): headers is Record<string, string> {
  if (typeof headers !== 'object' || headers === null || Array.isArray(headers)) {
    return false;
  }

  return Object.getPrototypeOf(headers) === Object.prototype
    || Object.getPrototypeOf(headers) === null;
}

function mergeHeaders(
  inputHeaders: QueryHeaders | undefined,
  overrideHeaders: QueryHeaders | undefined,
): QueryHeaders | undefined {
  if (isPlainHeaders(inputHeaders) && isPlainHeaders(overrideHeaders)) {
    return {
      ...inputHeaders,
      ...overrideHeaders,
    };
  }

  return overrideHeaders;
}

export function normalizeRequestInput<
  TBody = QueryBody,
  TParams extends QueryParams = QueryParams,
>(
  method: QueryMethod,
  input: QueryRequestInput<TBody, TParams> = {},
): NormalizedRequest<TBody, TParams> {
  const { params, body, headers, options } = input;

  return {
    method,
    query: params,
    body,
    headers,
    fetchOptions: (options ?? {}) as QueryFetchOptions,
  };
}

export function buildFetchRequestOptions<
  TBody = QueryBody,
  TParams extends QueryParams = QueryParams,
>(
  request: NormalizedRequest<TBody, TParams>,
) {
  return {
    method: request.method,
    query: request.query,
    body: request.body,
    headers: request.headers,
    ...request.fetchOptions,
  };
}

export function mergeQueryInput<TInput extends QueryBaseInput>(
  input: TInput,
  overrides: Partial<TInput> = {},
): TInput {
  const merged = {
    ...input,
    ...overrides,
  } as TInput;

  if (Object.hasOwn(overrides, 'headers')) {
    merged.headers = mergeHeaders(input.headers, overrides.headers);
  }

  return merged;
}

export function createQueryState<TData>(
  activeRequests: Ref<number> = ref(0),
): QueryState<TData> {
  const status = ref<QueryStatus>('idle');

  return {
    data: shallowRef<TData>(),
    error: shallowRef<ApiError | null>(null),
    status,
    pending: computed(() => activeRequests.value > 0),
  };
}

export function normalizeApiError(error: unknown): ApiError {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as Record<string, unknown>;

    return {
      message: typeof candidate.message === 'string' ? candidate.message : 'Request failed',
      statusCode: typeof candidate.statusCode === 'number' ? candidate.statusCode : undefined,
      data: candidate.data,
      cause: error,
    };
  }

  return {
    message: error instanceof Error ? error.message : 'Request failed',
    statusCode: undefined,
    data: undefined,
    cause: error,
  };
}

export function createQueryResult<TData, TInput = never>(
  execute: (overrides: Partial<TInput>) => Promise<TData> | TData,
): QueryResult<TData, TInput> {
  const activeRequests = ref(0);
  const state = createQueryState<TData>(activeRequests);

  return {
    ...state,
    async execute(overrides) {
      activeRequests.value += 1;
      state.status.value = 'pending';
      state.error.value = null;

      try {
        const result = await execute(overrides as Partial<TInput>);

        state.data.value = result;
        state.error.value = null;
        return result;
      } catch (error) {
        const normalizedError = normalizeApiError(error);

        state.error.value = normalizedError;
        throw normalizedError;
      } finally {
        activeRequests.value -= 1;
        state.status.value = activeRequests.value === 0
          ? state.error.value === null ? 'success' : 'error'
          : 'pending';
      }
    },
    reset() {
      state.data.value = undefined;
      state.error.value = null;
      state.status.value = 'idle';
    },
  };
}

export function createMutationState<TData, TError = Error>(): MutationState<TData, TError> {
  return {
    pending: ref(false),
    data: shallowRef<TData>(),
    error: shallowRef<TError | null>(null),
  };
}

export function createMutationResult<TData, TError = Error>(
  execute: MutationResult<TData, TError>['execute'],
): MutationResult<TData, TError> {
  const state = createMutationState<TData, TError>();

  return {
    ...state,
    async execute(overrides) {
      state.pending.value = true;
      state.error.value = null;

      try {
        const result = await execute(overrides);

        state.data.value = result;
        return result;
      } catch (error) {
        state.error.value = error as TError;
        throw error;
      } finally {
        state.pending.value = false;
      }
    },
    reset() {
      state.pending.value = false;
      state.data.value = undefined;
      state.error.value = null;
    },
  };
}
