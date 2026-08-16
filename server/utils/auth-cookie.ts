import type { H3Event } from 'h3';

export const accessCookieName = 'omninode_access';
export const refreshCookieName = 'omninode_refresh';

const accessMaxAge = 60 * 60;
const refreshMaxAge = 7 * 24 * 60 * 60;
const secureCookie = process.env.NODE_ENV === 'production';

export function setAuthCookies(
  event: H3Event,
  accessToken: string,
  refreshToken: string,
): void {
  setCookie(event, accessCookieName, accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookie,
    path: '/',
    maxAge: accessMaxAge,
  });
  setCookie(event, refreshCookieName, refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookie,
    path: '/api/auth',
    maxAge: refreshMaxAge,
  });
}

export function clearAuthCookies(event: H3Event): void {
  deleteCookie(event, accessCookieName, { path: '/', });
  deleteCookie(event, refreshCookieName, { path: '/api/auth', });
}
