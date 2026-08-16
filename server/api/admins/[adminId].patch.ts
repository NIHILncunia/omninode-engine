import type { AdminRole } from '../../../app/types/auth.types';
import { getAdministratorServices } from '../../services/administrator.server';
import { getRequestAdmin, isAdminRole, isYn, readPositiveInteger } from '../../utils/administrator-request';
import { readValidatedAuthBody, toAuthErrorResponse } from '../../utils/auth-request';
import { ApiError } from '../../utils/api-error';
import { CreateResponse } from '../../utils/createResponse';

interface UpdateAdminBody {
  name?: string;
  role?: AdminRole;
  useYn?: 'Y' | 'N';
}

function isUpdateAdminBody(body: unknown): body is UpdateAdminBody {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const value = body as Record<string, unknown>;
  return (value.name === undefined || typeof value.name === 'string')
    && (value.role === undefined || isAdminRole(value.role))
    && (value.useYn === undefined || isYn(value.useYn))
    && (value.name !== undefined || value.role !== undefined || value.useYn !== undefined);
}

export default defineEventHandler(async event => {
  try {
    const actor = await getRequestAdmin(event);
    const adminId = readPositiveInteger(getRouterParam(event, 'adminId'));
    const body = await readValidatedAuthBody(event, isUpdateAdminBody);

    if (body.name !== undefined && (body.name.trim().length < 1 || body.name.trim().length > 100)) {
      throw new ApiError(400, 'BAD_REQUEST');
    }

    const admin = await getAdministratorServices().administrators.update({
      actorAdminId: actor.id,
      adminId,
      ...body,
    });
    return CreateResponse.data(admin);
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
