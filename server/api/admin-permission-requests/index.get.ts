import { getAdministratorServices } from '../../services/administrator.server';
import { getRequestAdmin } from '../../utils/administrator-request';
import { toAuthErrorResponse } from '../../utils/auth-request';
import { CreateResponse } from '../../utils/createResponse';

export default defineEventHandler(async event => {
  try {
    const actor = await getRequestAdmin(event);
    return CreateResponse.data(await getAdministratorServices().permissionRequests.list(actor.id));
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
