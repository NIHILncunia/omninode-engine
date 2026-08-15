import { defineStore } from 'pinia';
import {
  ref,
} from 'vue';

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

export const useAuthStore = defineStore('auth', () => {
  const status = ref<AuthStatus>('unknown');
  const passwordChangeRequired = ref(false);

  const onSetAuthenticated = (requiresPasswordChange: boolean): void => {
    status.value = 'authenticated';
    passwordChangeRequired.value = requiresPasswordChange;
  };

  const onSetUnauthenticated = (): void => {
    status.value = 'unauthenticated';
    passwordChangeRequired.value = false;
  };

  const onSetPasswordChangeRequired = (): void => {
    passwordChangeRequired.value = true;
  };

  return {
    status,
    passwordChangeRequired,
    onSetAuthenticated,
    onSetUnauthenticated,
    onSetPasswordChangeRequired,
  };
});
