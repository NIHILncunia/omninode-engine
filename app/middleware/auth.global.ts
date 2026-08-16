import type { AuthenticatedAdmin } from '../types/auth.types';
import type { AuthStatus } from '../stores/auth.store';
import { useAuthStore } from '../stores/auth.store';

const publicPaths = new Set([
  '/',
  '/signin',
  '/admin-permission-request',
  '/docs',
  '/about',
]);

export const getAuthRedirect = (
  path: string,
  status: AuthStatus,
  passwordChangeRequired: boolean,
): '/signin' | '/account/password-change' | null => {
  if (publicPaths.has(path)) {
    return null;
  }

  if (status !== 'authenticated') {
    return '/signin';
  }

  if (passwordChangeRequired && path !== '/account/password-change') {
    return '/account/password-change';
  }

  return null;
};

export default defineNuxtRouteMiddleware(async to => {
  const auth = useAuthStore();

  if (import.meta.server) {
    const authenticatedAdmin = useRequestEvent()?.context.authenticatedAdmin as AuthenticatedAdmin | undefined;

    if (authenticatedAdmin) {
      auth.onSetAuthenticated(
        authenticatedAdmin.passwordChangeRequired,
        authenticatedAdmin,
      );
    }
  } else if (!publicPaths.has(to.path) && auth.status === 'unknown') {
    await auth.onRestoreSession();
  }

  const redirect = getAuthRedirect(
    to.path,
    auth.status,
    auth.passwordChangeRequired,
  );

  return redirect ? navigateTo(redirect) : undefined;
});
