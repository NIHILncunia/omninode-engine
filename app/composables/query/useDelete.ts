import { createMutation } from './createMutation';
import type { MutationQueryInput, QueryBody, QueryParams } from './types';

export function useDelete<
  TResponse,
  TBody extends QueryBody = QueryBody,
  TParams extends QueryParams = QueryParams,
>(input: MutationQueryInput<TBody, TParams, TResponse>) {
  return createMutation<TResponse, TBody, TParams>('DELETE', input);
}
