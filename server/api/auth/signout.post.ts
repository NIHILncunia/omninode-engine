import { CreateResponse } from '../../utils/createResponse';
import { clearAuthCookies, refreshCookieName } from '../../utils/auth-cookie';
import { toAuthErrorResponse } from '../../utils/auth-request';
import { getAuthService } from '../../services/auth.server';

export default defineEventHandler(async event => {
  try {
    const refreshToken = getCookie(event, refreshCookieName);

    if (refreshToken) {
      await getAuthService().signout(refreshToken);
    }

    clearAuthCookies(event);

    return CreateResponse.data(null);
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
