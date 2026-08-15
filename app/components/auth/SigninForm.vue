<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth.store';
import { cn } from '~/utils/cn';

const auth = useAuthStore();
const email = ref('');
const password = ref('');

const cssVariants = cva([
  'mx-auto',
  'flex',
  'w-full',
  'max-w-md',
  'flex-col',
  'gap-5',
  'rounded-md',
  'border',
  'border-black-300',
  'bg-white',
  'p-8',
  'shadow-sm',
], {
  variants: {},
  compoundVariants: [
  ],
  defaultVariants: {},
});

const onSubmitSignin = async (): Promise<void> => {
  const signedIn = await auth.onSignin(email.value, password.value);

  if (!signedIn) {
    return;
  }

  await navigateTo(auth.passwordChangeRequired
    ? '/account/password-change'
    : '/account');
};
</script>

<template>
  <section class="flex min-h-dvh items-center px-4 py-8">
    <form
      :class="cn([cssVariants({})])"
      @submit.prevent="onSubmitSignin"
    >
      <header class="flex flex-col gap-1">
        <h1 class="text-h3 font-700">관리자 로그인</h1>
        <p class="text-sm text-black-600">옴니노드 관리 환경에 로그인합니다.</p>
      </header>

      <ErrorState
        v-if="auth.errorMessage"
        :description="auth.errorMessage"
        title="로그인하지 못했습니다."
        class="items-start p-0"
      />

      <label class="flex flex-col gap-1">
        <span>이메일</span>
        <input
          v-model="email"
          autocomplete="email"
          class="rounded-sm border border-black-300 px-3 py-2"
          name="email"
          required
          type="email"
        >
      </label>

      <label class="flex flex-col gap-1">
        <span>비밀번호</span>
        <input
          v-model="password"
          autocomplete="current-password"
          class="rounded-sm border border-black-300 px-3 py-2"
          name="password"
          required
          type="password"
        >
      </label>

      <button
        class="rounded-sm bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
        :disabled="auth.isLoading"
        type="submit"
      >
        {{ auth.isLoading ? '로그인 중입니다.' : '로그인' }}
      </button>
    </form>
  </section>
</template>
