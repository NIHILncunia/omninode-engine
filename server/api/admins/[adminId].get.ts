import { getAdministratorServices } from '../../services/administrator.server';
import { getRequestAdmin, readPositiveInteger } from '../../utils/administrator-request';
import { toAuthErrorResponse } from '../../utils/auth-request';
import { CreateResponse } from '../../utils/createResponse';

export default defineEventHandler(async event => {
  try {
    const actor = await getRequestAdmin(event);
    const adminId = readPositiveInteger(getRouterParam(event, 'adminId'));
    const admin = await getAdministratorServices().administrators.get(actor.id, adminId);
    return CreateResponse.data(admin);
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
