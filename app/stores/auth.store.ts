import { defineStore } from 'pinia';
import {
  ref,
} from 'vue';
import type { AuthenticatedAdmin } from '../types/auth.types';

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

interface AuthResponse {
  error: boolean;
  data: {
    admin: AuthenticatedAdmin;
  } | null;
}

function hasAuthenticatedAdmin(response: AuthResponse): response is AuthResponse & {
  error: false;
  data: { admin: AuthenticatedAdmin; };
} {
  return !response.error && response.data !== null;
}

function getAuthenticatedAdmin(response: AuthResponse): AuthenticatedAdmin {
  if (!hasAuthenticatedAdmin(response)) {
    throw new Error('세션 정보를 확인할 수 없습니다.');
  }

  return response.data.admin;
}

function isUnauthorizedError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const statusCode = 'statusCode' in error ? error.statusCode : undefined;
  const status = 'status' in error ? error.status : undefined;

  return statusCode === 401 || status === 401;
}

export const useAuthStore = defineStore('auth', () => {
  const status = ref<AuthStatus>('unknown');
  const admin = ref<AuthenticatedAdmin | null>(null);
  const passwordChangeRequired = ref(false);
  const errorMessage = ref<string | null>(null);
  const isLoading = ref(false);

  const onSetAuthenticated = (requiresPasswordChange: boolean, authenticatedAdmin?: AuthenticatedAdmin): void => {
    status.value = 'authenticated';
    passwordChangeRequired.value = requiresPasswordChange;
    admin.value = authenticatedAdmin ?? admin.value;
  };

  const onSetUnauthenticated = (): void => {
    status.value = 'unauthenticated';
    passwordChangeRequired.value = false;
    admin.value = null;
  };

  const onSetPasswordChangeRequired = (): void => {
    passwordChangeRequired.value = true;
  };

  const onApplyAuthenticatedAdmin = (authenticatedAdmin: AuthenticatedAdmin): void => {
    onSetAuthenticated(authenticatedAdmin.passwordChangeRequired, authenticatedAdmin);
  };

  const onRestoreSession = async (): Promise<boolean> => {
    isLoading.value = true;
    errorMessage.value = null;
    const requestFetch = useRequestFetch();

    try {
      const response = await requestFetch<AuthResponse>('/api/auth/me', {
        credentials: 'include',
      });

      onApplyAuthenticatedAdmin(getAuthenticatedAdmin(response));

      return true;
    } catch (error: unknown) {
      if (!isUnauthorizedError(error)) {
        throw error;
      }

      try {
        await requestFetch<AuthResponse>('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        const response = await requestFetch<AuthResponse>('/api/auth/me', {
          credentials: 'include',
        });

        onApplyAuthenticatedAdmin(getAuthenticatedAdmin(response));

        return true;
      } catch (refreshError: unknown) {
        if (!isUnauthorizedError(refreshError)) {
          throw refreshError;
        }

        onSetUnauthenticated();

        return false;
      }
    } finally {
      isLoading.value = false;
    }
  };

  const onSignin = async (email: string, password: string): Promise<boolean> => {
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const response = await $fetch<AuthResponse>('/api/auth/signin', {
        method: 'POST',
        credentials: 'include',
        body: {
          email,
          password,
        },
      });

      if (!hasAuthenticatedAdmin(response)) {
        throw new Error('로그인 정보를 확인할 수 없습니다.');
      }

      onApplyAuthenticatedAdmin(response.data.admin);

      return true;
    } catch {
      onSetUnauthenticated();
      errorMessage.value = '이메일 또는 비밀번호를 확인해 주세요.';

      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const onChangePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> => {
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const response = await $fetch<AuthResponse>('/api/auth/password', {
        method: 'POST',
        credentials: 'include',
        body: {
          currentPassword,
          newPassword,
        },
      });

      if (!hasAuthenticatedAdmin(response)) {
        throw new Error('비밀번호 변경 정보를 확인할 수 없습니다.');
      }

      onApplyAuthenticatedAdmin(response.data.admin);

      return true;
    } catch {
      errorMessage.value = '현재 비밀번호를 확인해 주세요.';

      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const onSignOut = async (): Promise<void> => {
    isLoading.value = true;
    errorMessage.value = null;

    try {
      await $fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      onSetUnauthenticated();
      isLoading.value = false;
    }
  };

  return {
    status,
    admin,
    passwordChangeRequired,
    errorMessage,
    isLoading,
    onSetAuthenticated,
    onSetUnauthenticated,
    onSetPasswordChangeRequired,
    onRestoreSession,
    onSignin,
    onChangePassword,
    onSignOut,
  };
});
