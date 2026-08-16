import { getAdministratorServices } from '../../../../services/administrator.server';
import { getRequestAdmin, readPositiveInteger } from '../../../../utils/administrator-request';
import { toAuthErrorResponse } from '../../../../utils/auth-request';
import { CreateResponse } from '../../../../utils/createResponse';

export default defineEventHandler(async event => {
  try {
    const actor = await getRequestAdmin(event);
    const projectId = readPositiveInteger(getRouterParam(event, 'projectId'));
    const admins = await getAdministratorServices().projectAdmins.list(actor.id, projectId);
    return CreateResponse.data(admins);
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
