import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, shallowRef } from 'vue';

import { createDefaultQueryKey, executeFetch, mergeQueryInput, normalizeRequestInput } from './shared';
import type { GetQueryInput, QueryParams, QueryResult } from './types';

export function useGet<
  TResponse,
  TParams extends QueryParams = QueryParams,
>(input: GetQueryInput<TParams, TResponse>): QueryResult<TResponse, GetQueryInput<TParams, TResponse>> {
  const requestInput = shallowRef(input);
  const queryClient = useQueryClient();
  const options = computed(() => {
    const request = requestInput.value;
    const queryOptions = request.queryOptions ?? {};

    return {
      ...queryOptions,
      queryKey: queryOptions.queryKey ?? createDefaultQueryKey(request.url, request.params),
      queryFn: queryOptions.queryFn ?? (async () => await executeFetch<TResponse>(
        normalizeRequestInput('GET', request),
      )),
    };
  });
  const result = useQuery(options);

  return {
    data: result.data,
    error: result.error,
    status: result.status,
    pending: computed(() => result.isPending.value),
    async execute(overrides = {}) {
      requestInput.value = mergeQueryInput(requestInput.value, overrides);
      const refreshed = await result.refetch();

      return refreshed.data;
    },
    reset() {
      void queryClient.resetQueries({
        queryKey: options.value.queryKey,
        exact: true,
      });
    },
  };
}
