import { useAuthStore } from '../stores/auth.store';

export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore();
  return auth.admin?.role === 'SUPER_ADMIN' || auth.admin?.role === 'ADMIN'
    ? undefined
    : navigateTo('/account');
});
