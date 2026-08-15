import { CreateResponse } from '../../utils/createResponse';
import { refreshCookieName, setAuthCookies } from '../../utils/auth-cookie';
import { toAuthErrorResponse } from '../../utils/auth-request';
import { getAuthService } from '../../services/auth.server';
import { ApiError } from '../../utils/api-error';

export default defineEventHandler(async event => {
  try {
    const refreshToken = getCookie(event, refreshCookieName);

    if (!refreshToken) {
      throw new ApiError(401, 'UNAUTHORIZED');
    }

    const session = await getAuthService().refresh({
      refreshToken,
      deviceInfo: getHeader(event, 'user-agent')?.slice(0, 500),
    });
    setAuthCookies(event, session.accessToken, session.refreshToken);

    return CreateResponse.data({ admin: session.admin, });
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
