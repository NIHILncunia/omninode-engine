import { getAdministratorServices } from '../../services/administrator.server';
import { isNonEmptyString, readValidatedAuthBody, toAuthErrorResponse } from '../../utils/auth-request';
import { ApiError } from '../../utils/api-error';
import { CreateResponse } from '../../utils/createResponse';

interface SubmitRequestBody { email: string; name: string; }

function isSubmitRequestBody(body: unknown): body is SubmitRequestBody {
  if (typeof body !== 'object' || body === null) return false;
  const value = body as Record<string, unknown>;
  return isNonEmptyString(value.email) && isNonEmptyString(value.name);
}

export default defineEventHandler(async event => {
  try {
    const body = await readValidatedAuthBody(event, isSubmitRequestBody);
    const email = body.email.trim();
    const name = body.name.trim();
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320 || name.length > 100) {
      throw new ApiError(400, 'BAD_REQUEST');
    }
    const request = await getAdministratorServices().permissionRequests.submit({ email, name, });
    setResponseStatus(event, 201);
    return CreateResponse.data(request, 'CREATED', 'CREATED');
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
