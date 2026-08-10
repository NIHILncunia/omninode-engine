import { createMutation } from './createMutation';
import type { MutationQueryInput, QueryBody, QueryParams } from './types';

export function usePut<
  TResponse,
  TBody extends QueryBody = QueryBody,
  TParams extends QueryParams = QueryParams,
>(input: MutationQueryInput<TBody, TParams>) {
  return createMutation<TResponse, TBody, TParams>('PUT', input);
}
