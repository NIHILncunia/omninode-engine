import { CreateResponse } from '../../utils/createResponse';
import { setAuthCookies } from '../../utils/auth-cookie';
import { isNonEmptyString, readValidatedAuthBody, toAuthErrorResponse } from '../../utils/auth-request';
import { getAuthService } from '../../services/auth.server';

interface SigninBody {
  email: string;
  password: string;
}

function isSigninBody(body: unknown): body is SigninBody {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const candidate = body as Record<string, unknown>;

  return isNonEmptyString(candidate.email) && isNonEmptyString(candidate.password);
}

export default defineEventHandler(async event => {
  try {
    const body = await readValidatedAuthBody(event, isSigninBody);
    const session = await getAuthService().signin({
      ...body,
      deviceInfo: getHeader(event, 'user-agent')?.slice(0, 500),
    });
    setAuthCookies(event, session.accessToken, session.refreshToken);

    return CreateResponse.data({ admin: session.admin, });
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
