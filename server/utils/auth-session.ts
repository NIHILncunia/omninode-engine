import type { H3Event } from 'h3';
import type { AuthenticatedAdmin } from '../../app/types/auth.types';
import { getAuthService } from '../services/auth.server';
import {
  accessCookieName,
  refreshCookieName,
  setAuthCookies,
} from './auth-cookie';
import { ApiError } from './api-error';

function isUnauthorizedError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.statusCode === 401;
}

export async function restoreRequestAdmin(event: H3Event): Promise<AuthenticatedAdmin | null> {
  const authService = getAuthService();
  const accessToken = getCookie(event, accessCookieName);

  if (accessToken) {
    try {
      return await authService.getAuthenticatedAdmin(accessToken);
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        throw error;
      }
    }
  }

  const refreshToken = getCookie(event, refreshCookieName);

  if (!refreshToken) {
    return null;
  }

  try {
    const session = await authService.refresh({
      refreshToken,
      deviceInfo: undefined,
    });
    setAuthCookies(event, session.accessToken, session.refreshToken);

    return session.admin;
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return null;
    }

    throw error;
  }
}
