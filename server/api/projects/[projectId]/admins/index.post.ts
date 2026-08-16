import { getAdministratorServices } from '../../../../services/administrator.server';
import { getRequestAdmin, readPositiveInteger } from '../../../../utils/administrator-request';
import { readValidatedAuthBody, toAuthErrorResponse } from '../../../../utils/auth-request';
import { ApiError } from '../../../../utils/api-error';
import { CreateResponse } from '../../../../utils/createResponse';
import { permissionCodes, type PermissionCode, type PermissionGrant } from '../../../../types/permission.types';

interface AssignProjectAdminBody { adminId: number; permissions: Record<PermissionCode, PermissionGrant>; }

function isAssignProjectAdminBody(body: unknown): body is AssignProjectAdminBody {
  if (typeof body !== 'object' || body === null) return false;
  const value = body as Record<string, unknown>;
  if (!Number.isSafeInteger(value.adminId) || Number(value.adminId) < 1 || typeof value.permissions !== 'object' || value.permissions === null) return false;
  const permissions = value.permissions as Record<string, unknown>;
  return permissionCodes.every(code => permissions[code] === 'Y' || permissions[code] === 'N');
}

export default defineEventHandler(async event => {
  try {
    const actor = await getRequestAdmin(event);
    const projectId = readPositiveInteger(getRouterParam(event, 'projectId'));
    const body = await readValidatedAuthBody(event, isAssignProjectAdminBody);
    await getAdministratorServices().projectAdmins.assign({
      actorAdminId: actor.id,
      projectId,
      adminId: body.adminId,
      grants: body.permissions,
    });
    setResponseStatus(event, 201);
    return CreateResponse.data(null, 'CREATED', 'CREATED');
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
