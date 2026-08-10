import type { FetchOptions, ResponseType } from 'ofetch';
import type { ComputedRef, Ref } from 'vue';

export type QueryParams = Record<string, unknown>;

export type QueryHeaders = HeadersInit;

export type QueryBody = BodyInit | Record<string, unknown> | null | undefined;
export type QueryMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
export type QueryStatus = 'idle' | 'pending' | 'success' | 'error';

export type QueryFetchOptions = Omit<
  FetchOptions<ResponseType>,
  'body' | 'headers' | 'method' | 'query'
>;

export interface QueryBaseInput<TParams extends QueryParams = QueryParams> {
  url: string;
  params?: TParams;
  headers?: QueryHeaders;
  options?: QueryFetchOptions;
}

export interface GetQueryInput<TParams extends QueryParams = QueryParams>
  extends QueryBaseInput<TParams> {
  immediate?: boolean;
}

export interface MutationQueryInput<
  TBody = QueryBody,
  TParams extends QueryParams = QueryParams,
> extends QueryBaseInput<TParams> {
  body?: TBody;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  data: unknown;
  cause: unknown;
}

export interface QueryResult<TData, TInput> {
  data: Ref<TData | undefined>;
  error: Ref<ApiError | null>;
  status: Ref<QueryStatus>;
  pending: ComputedRef<boolean>;
  execute: (overrides?: Partial<TInput>) => Promise<TData | undefined>;
  reset: () => void;
}

export interface QueryRequestInput<
  TBody = QueryBody,
  TParams extends QueryParams = QueryParams,
> {
  params?: TParams;
  body?: TBody;
  headers?: QueryHeaders;
  options?: QueryFetchOptions;
}

export interface NormalizedRequest<
  TBody = QueryBody,
  TParams extends QueryParams = QueryParams,
> {
  method: QueryMethod;
  query?: TParams;
  body?: TBody;
  headers?: QueryHeaders;
  fetchOptions: QueryFetchOptions;
}

export interface MutationState<TData, TError = Error> {
  pending: Ref<boolean>;
  data: Ref<TData | undefined>;
  error: Ref<TError | null>;
}

export interface MutationResult<TData, TError = Error>
  extends MutationState<TData, TError> {
  execute: <TBody = QueryBody, TParams extends QueryParams = QueryParams>(
    overrides?: QueryRequestInput<TBody, TParams>,
  ) => Promise<TData>;
  reset: () => void;
}
