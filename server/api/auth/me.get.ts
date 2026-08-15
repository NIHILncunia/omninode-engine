import { CreateResponse } from '../../utils/createResponse';
import { accessCookieName } from '../../utils/auth-cookie';
import { toAuthErrorResponse } from '../../utils/auth-request';
import { getAuthService } from '../../services/auth.server';
import { ApiError } from '../../utils/api-error';

export default defineEventHandler(async event => {
  try {
    const accessToken = getCookie(event, accessCookieName);

    if (!accessToken) {
      throw new ApiError(401, 'UNAUTHORIZED');
    }

    const admin = await getAuthService().getAuthenticatedAdmin(accessToken);

    return CreateResponse.data({ admin, });
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
