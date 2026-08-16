import { getAdministratorServices } from '../../../../services/administrator.server';
import { getRequestAdmin, readPositiveInteger } from '../../../../utils/administrator-request';
import { isNonEmptyString, readValidatedAuthBody, toAuthErrorResponse } from '../../../../utils/auth-request';
import { ApiError } from '../../../../utils/api-error';
import { CreateResponse } from '../../../../utils/createResponse';

interface InviteProjectAdminBody {
  email: string;
  name?: string;
}

function isInviteProjectAdminBody(body: unknown): body is InviteProjectAdminBody {
  if (typeof body !== 'object' || body === null) return false;
  const value = body as Record<string, unknown>;
  return isNonEmptyString(value.email)
    && (value.name === undefined || isNonEmptyString(value.name));
}

export default defineEventHandler(async event => {
  try {
    const actor = await getRequestAdmin(event);
    const projectId = readPositiveInteger(getRouterParam(event, 'projectId'));
    const body = await readValidatedAuthBody(event, isInviteProjectAdminBody);

    if (!/^\S+@\S+\.\S+$/.test(body.email) || body.email.length > 320 || (body.name?.length ?? 0) > 100) {
      throw new ApiError(400, 'BAD_REQUEST');
    }

    const admin = await getAdministratorServices().projectAdmins.invite({
      actorAdminId: actor.id,
      projectId,
      email: body.email,
      name: body.name,
    });
    setResponseStatus(event, 201);
    return CreateResponse.data(admin, 'CREATED', 'CREATED');
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
