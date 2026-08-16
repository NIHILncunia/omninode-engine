import { getAdministratorServices } from '../../services/administrator.server';
import { getRequestAdmin, readNonNegativeInteger } from '../../utils/administrator-request';
import { toAuthErrorResponse } from '../../utils/auth-request';
import { CreateResponse } from '../../utils/createResponse';

export default defineEventHandler(async event => {
  try {
    const actor = await getRequestAdmin(event);
    const query = getQuery(event);
    const page = readNonNegativeInteger(query.page, 0);
    const pageSize = Math.min(readNonNegativeInteger(query.pageSize, 20) || 20, 100);
    const search = typeof query.search === 'string' ? query.search.trim() : undefined;
    const result = await getAdministratorServices().administrators.list({
      actorAdminId: actor.id,
      page,
      pageSize,
      search: search || undefined,
    });

    return CreateResponse.list({
      ...result,
      page,
      pageSize,
    });
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
