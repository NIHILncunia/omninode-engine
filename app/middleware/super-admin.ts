import { useAuthStore } from '../stores/auth.store';

export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore();
  return auth.admin?.role === 'SUPER_ADMIN' ? undefined : navigateTo('/account');
});
