import { CreateResponse } from '../../utils/createResponse';
import { accessCookieName, setAuthCookies } from '../../utils/auth-cookie';
import { isNonEmptyString, readValidatedAuthBody, toAuthErrorResponse } from '../../utils/auth-request';
import { getAuthService } from '../../services/auth.server';
import { ApiError } from '../../utils/api-error';

interface PasswordChangeBody {
  currentPassword: string;
  newPassword: string;
}

function isPasswordChangeBody(body: unknown): body is PasswordChangeBody {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const candidate = body as Record<string, unknown>;

  return isNonEmptyString(candidate.currentPassword)
    && isNonEmptyString(candidate.newPassword)
    && candidate.newPassword.length >= 8;
}

export default defineEventHandler(async event => {
  try {
    const accessToken = getCookie(event, accessCookieName);

    if (!accessToken) {
      throw new ApiError(401, 'UNAUTHORIZED');
    }

    const body = await readValidatedAuthBody(event, isPasswordChangeBody);
    const authService = getAuthService();
    const admin = await authService.getAuthenticatedAdmin(accessToken);
    const session = await authService.changePassword({
      adminId: admin.id,
      ...body,
      deviceInfo: getHeader(event, 'user-agent')?.slice(0, 500),
    });
    setAuthCookies(event, session.accessToken, session.refreshToken);

    return CreateResponse.data({ admin: session.admin, });
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
