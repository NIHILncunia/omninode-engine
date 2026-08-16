import { getAdministratorServices } from '../../services/administrator.server';
import { getRequestAdmin, isAdminRole } from '../../utils/administrator-request';
import { isNonEmptyString, readValidatedAuthBody, toAuthErrorResponse } from '../../utils/auth-request';
import { ApiError } from '../../utils/api-error';
import { CreateResponse } from '../../utils/createResponse';

interface CreateAdminBody {
  email: string;
  name: string;
  role: 'ADMIN' | 'SUB_ADMIN';
}

function isCreateAdminBody(body: unknown): body is CreateAdminBody {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const value = body as Record<string, unknown>;
  return isNonEmptyString(value.email)
    && isNonEmptyString(value.name)
    && isAdminRole(value.role)
    && value.role !== 'SUPER_ADMIN';
}

export default defineEventHandler(async event => {
  try {
    const actor = await getRequestAdmin(event);
    const body = await readValidatedAuthBody(event, isCreateAdminBody);
    const email = body.email.trim();

    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320 || body.name.trim().length > 100) {
      throw new ApiError(400, 'BAD_REQUEST');
    }

    const admin = await getAdministratorServices().administrators.create({
      actorAdminId: actor.id,
      email,
      name: body.name,
      role: body.role,
    });
    setResponseStatus(event, 201);
    return CreateResponse.data(admin, 'CREATED', 'CREATED');
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
