import { getAdministratorServices } from '../../../../services/administrator.server';
import { getRequestAdmin, readPositiveInteger } from '../../../../utils/administrator-request';
import { toAuthErrorResponse } from '../../../../utils/auth-request';
import { CreateResponse } from '../../../../utils/createResponse';

export default defineEventHandler(async event => {
  try {
    const actor = await getRequestAdmin(event);
    const projectId = readPositiveInteger(getRouterParam(event, 'projectId'));
    const adminId = readPositiveInteger(getRouterParam(event, 'adminId'));
    await getAdministratorServices().projectAdmins.remove(actor.id, projectId, adminId);
    return CreateResponse.data(null);
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
