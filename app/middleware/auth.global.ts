import type { RouteLocationNormalized } from 'vue-router';
import type { AuthStatus } from '../stores/auth.store';
import { useAuthStore } from '../stores/auth.store';

const publicPaths = new Set([
  '/signin',
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

export default (to: RouteLocationNormalized) => {
  const auth = useAuthStore();
  const redirect = getAuthRedirect(
    to.path,
    auth.status,
    auth.passwordChangeRequired,
  );

  return redirect ? navigateTo(redirect) : undefined;
};
