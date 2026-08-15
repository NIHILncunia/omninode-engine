import type {
  BaseResponse,
  ResponseKey,
} from '~/types/response.types';
import { CreateResponse } from './createResponse';

type ApiErrorStatusCode = 400 | 401 | 403 | 404 | 409 | 500;

export class ApiError extends Error {
  constructor(
    public readonly statusCode: ApiErrorStatusCode,
    public readonly code: ResponseKey,
    message?: string,
  ) {
    super(message);
  }
}

export interface ApiErrorResponse {
  statusCode: ApiErrorStatusCode;
  body: BaseResponse<null>;
}

export const toApiErrorResponse = (error: unknown): ApiErrorResponse => {
  const apiError = error instanceof ApiError
    ? error
    : new ApiError(500, 'INTERNAL_SERVER_ERROR');

  return {
    statusCode: apiError.statusCode,
    body: CreateResponse.error(apiError.code, apiError.code),
  };
};
