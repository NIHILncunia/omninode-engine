import { getAdministratorServices } from '../../../../services/administrator.server';
import { getRequestAdmin, readPositiveInteger } from '../../../../utils/administrator-request';
import { readValidatedAuthBody, toAuthErrorResponse } from '../../../../utils/auth-request';
import { CreateResponse } from '../../../../utils/createResponse';
import { permissionCodes, type PermissionCode, type PermissionGrant } from '../../../../types/permission.types';

interface UpdateProjectAdminBody { permissions: Record<PermissionCode, PermissionGrant>; }

function isUpdateProjectAdminBody(body: unknown): body is UpdateProjectAdminBody {
  if (typeof body !== 'object' || body === null || typeof (body as Record<string, unknown>).permissions !== 'object') return false;
  const permissions = (body as { permissions: Record<string, unknown> }).permissions;
  return permissionCodes.every(code => permissions[code] === 'Y' || permissions[code] === 'N');
}

export default defineEventHandler(async event => {
  try {
    const actor = await getRequestAdmin(event);
    const projectId = readPositiveInteger(getRouterParam(event, 'projectId'));
    const adminId = readPositiveInteger(getRouterParam(event, 'adminId'));
    const body = await readValidatedAuthBody(event, isUpdateProjectAdminBody);
    await getAdministratorServices().projectAdmins.assign({
      actorAdminId: actor.id,
      projectId,
      adminId,
      grants: body.permissions,
    });
    return CreateResponse.data(null);
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
