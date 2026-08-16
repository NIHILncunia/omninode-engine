import { getAdministratorServices } from '../../services/administrator.server';
import { getRequestAdmin } from '../../utils/administrator-request';
import { toAuthErrorResponse } from '../../utils/auth-request';
import { CreateResponse } from '../../utils/createResponse';

export default defineEventHandler(async event => {
  try {
    const actor = await getRequestAdmin(event);
    const permissions = await getAdministratorServices().administrators.listPermissionMasters(actor.id);
    return CreateResponse.data(permissions);
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
