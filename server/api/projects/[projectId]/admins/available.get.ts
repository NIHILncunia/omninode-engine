import { getAdministratorServices } from '../../../../services/administrator.server';
import { getRequestAdmin, readPositiveInteger } from '../../../../utils/administrator-request';
import { toAuthErrorResponse } from '../../../../utils/auth-request';
import { CreateResponse } from '../../../../utils/createResponse';

export default defineEventHandler(async event => {
  try {
    const actor = await getRequestAdmin(event);
    const projectId = readPositiveInteger(getRouterParam(event, 'projectId'));
    return CreateResponse.data(await getAdministratorServices().projectAdmins.listAssignable(actor.id, projectId));
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
