import { useMutation } from '@tanstack/vue-query';
import { computed } from 'vue';

import { executeFetch, mergeQueryInput, normalizeRequestInput } from './shared';
import type { MutationQueryInput, QueryBody, QueryMethod, QueryParams, QueryResult } from './types';

type MutationMethod = Exclude<QueryMethod, 'GET'>;

export function createMutation<
  TResponse,
  TBody extends QueryBody = QueryBody,
  TParams extends QueryParams = QueryParams,
>(
  method: MutationMethod,
  input: MutationQueryInput<TBody, TParams, TResponse>,
): QueryResult<TResponse, MutationQueryInput<TBody, TParams, TResponse>> {
  const mutationOptions = input.mutationOptions ?? {};
  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: mutationOptions.mutationFn ?? (async (overrides = {}) => {
      const request = mergeQueryInput(input, overrides);

      return await executeFetch<TResponse>(normalizeRequestInput(method, request));
    }),
  });

  return {
    data: mutation.data,
    error: mutation.error,
    status: mutation.status,
    pending: computed(() => mutation.isPending.value),
    async execute(overrides = {}) {
      return await mutation.mutateAsync(overrides);
    },
    reset() {
      mutation.reset();
    },
  };
}
