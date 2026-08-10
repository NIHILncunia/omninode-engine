import { computed, shallowRef, watch } from 'vue';

import { mergeQueryInput } from './shared';
import type { ApiError, GetQueryInput, QueryParams, QueryResult } from './types';

type UseFetchData<TResponse> = ReturnType<typeof useFetch<TResponse, ApiError>>['data']['value'];

export function useGet<
  TResponse,
  TParams extends QueryParams = QueryParams,
>(input: GetQueryInput<TParams>): QueryResult<UseFetchData<TResponse>, GetQueryInput<TParams>> {
  const requestInput = shallowRef(input);
  const result = useFetch<TResponse, ApiError>(() => requestInput.value.url, {
    ...input.options,
    headers: () => requestInput.value.headers,
    immediate: input.immediate ?? false,
    query: () => requestInput.value.params,
    watch: false,
  });
  const error = shallowRef<ApiError | null>(result.error.value ?? null);

  watch(result.error, (value) => {
    error.value = value ?? null;
  }, {
    flush: 'sync',
  });

  return {
    data: result.data,
    error,
    status: result.status,
    pending: computed(() => result.pending.value),
    async execute(overrides = {}) {
      requestInput.value = mergeQueryInput(requestInput.value, overrides);
      await result.refresh();
      return result.data.value;
    },
    reset() {
      result.clear();
      error.value = null;
    },
  };
}
