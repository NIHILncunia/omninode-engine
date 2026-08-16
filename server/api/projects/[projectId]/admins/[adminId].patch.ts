import { getAdministratorServices } from '../../../../services/administrator.server';
import { getRequestAdmin, isYn, readPositiveInteger } from '../../../../utils/administrator-request';
import { readValidatedAuthBody, toAuthErrorResponse } from '../../../../utils/auth-request';
import { CreateResponse } from '../../../../utils/createResponse';

interface UpdateProjectAdminBody { useYn: 'Y' | 'N' }

function isUpdateProjectAdminBody(body: unknown): body is UpdateProjectAdminBody {
  return typeof body === 'object'
    && body !== null
    && isYn((body as Record<string, unknown>).useYn);
}

export default defineEventHandler(async event => {
  try {
    const actor = await getRequestAdmin(event);
    const projectId = readPositiveInteger(getRouterParam(event, 'projectId'));
    const adminId = readPositiveInteger(getRouterParam(event, 'adminId'));
    const body = await readValidatedAuthBody(event, isUpdateProjectAdminBody);
    await getAdministratorServices().projectAdmins.update(actor.id, projectId, adminId, body.useYn);
    return CreateResponse.data(null);
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
