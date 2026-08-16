import { getAdministratorServices } from '../../../services/administrator.server';
import { getRequestAdmin, readPositiveInteger } from '../../../utils/administrator-request';
import { isNonEmptyString, readValidatedAuthBody, toAuthErrorResponse } from '../../../utils/auth-request';
import { ApiError } from '../../../utils/api-error';
import { CreateResponse } from '../../../utils/createResponse';

interface RejectRequestBody { reason: string; }

function isRejectRequestBody(body: unknown): body is RejectRequestBody {
  return typeof body === 'object' && body !== null && isNonEmptyString((body as Record<string, unknown>).reason);
}

export default defineEventHandler(async event => {
  try {
    const actor = await getRequestAdmin(event);
    const requestId = readPositiveInteger(getRouterParam(event, 'requestId'));
    const body = await readValidatedAuthBody(event, isRejectRequestBody);
    const reason = body.reason.trim();
    if (reason.length > 500) throw new ApiError(400, 'BAD_REQUEST');
    return CreateResponse.data(await getAdministratorServices().permissionRequests.reject({
      actorAdminId: actor.id,
      requestId,
      reason,
    }));
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
