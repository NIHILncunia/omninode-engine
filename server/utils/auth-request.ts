import { ApiError, toApiErrorResponse } from './api-error';

export async function readValidatedAuthBody<TBody>(
  event: Parameters<typeof readBody>[0],
  validate: (body: unknown) => body is TBody,
): Promise<TBody> {
  const body = await readBody(event);

  if (!validate(body)) {
    throw new ApiError(400, 'BAD_REQUEST');
  }

  return body;
}

export function toAuthErrorResponse(event: Parameters<typeof setResponseStatus>[0], error: unknown) {
  const response = toApiErrorResponse(error);
  setResponseStatus(event, response.statusCode);

  return response.body;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
