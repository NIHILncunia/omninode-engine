import { createQueryResult, mergeQueryInput } from './shared';
import type { MutationQueryInput, QueryBody, QueryMethod, QueryParams, QueryResult } from './types';

type MutationMethod = Exclude<QueryMethod, 'GET'>;

export function createMutation<
  TResponse,
  TBody extends QueryBody = QueryBody,
  TParams extends QueryParams = QueryParams,
>(
  method: MutationMethod,
  input: MutationQueryInput<TBody, TParams>,
): QueryResult<TResponse, MutationQueryInput<TBody, TParams>> {
  return createQueryResult(async (overrides = {}) => {
    const request = mergeQueryInput(input, overrides);

    return await $fetch<TResponse>(request.url, {
      method,
      query: request.params,
      body: request.body,
      headers: request.headers,
      ...request.options,
    });
  });
}
