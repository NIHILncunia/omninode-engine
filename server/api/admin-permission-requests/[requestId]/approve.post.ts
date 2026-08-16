import { getAdministratorServices } from '../../../services/administrator.server';
import { getRequestAdmin, readPositiveInteger } from '../../../utils/administrator-request';
import { toAuthErrorResponse } from '../../../utils/auth-request';
import { CreateResponse } from '../../../utils/createResponse';

export default defineEventHandler(async event => {
  try {
    const actor = await getRequestAdmin(event);
    const requestId = readPositiveInteger(getRouterParam(event, 'requestId'));
    return CreateResponse.data(await getAdministratorServices().permissionRequests.approve({
      actorAdminId: actor.id,
      requestId,
    }));
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
