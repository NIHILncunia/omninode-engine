<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth.store';
import { cn } from '~/utils/cn';

const auth = useAuthStore();
const currentPassword = ref('');
const newPassword = ref('');

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

const onSubmitPasswordChange = async (): Promise<void> => {
  if (newPassword.value.length < 8) {
    return;
  }

  const changed = await auth.onChangePassword(currentPassword.value, newPassword.value);

  if (changed) {
    await navigateTo('/account');
  }
};
</script>

<template>
  <section class="flex min-h-dvh items-center px-4 py-8">
    <form
      :class="cn([cssVariants({})])"
      @submit.prevent="onSubmitPasswordChange"
    >
      <header class="flex flex-col gap-1">
        <h1 class="text-h3 font-700">비밀번호 변경</h1>
        <p class="text-sm text-black-600">새 비밀번호는 8자 이상으로 설정해 주세요.</p>
      </header>

      <ErrorState
        v-if="auth.errorMessage"
        :description="auth.errorMessage"
        title="비밀번호를 변경하지 못했습니다."
        class="items-start p-0"
      />

      <label class="flex flex-col gap-1">
        <span>현재 비밀번호</span>
        <input
          v-model="currentPassword"
          autocomplete="current-password"
          class="rounded-sm border border-black-300 px-3 py-2"
          name="currentPassword"
          required
          type="password"
        >
      </label>

      <label class="flex flex-col gap-1">
        <span>새 비밀번호</span>
        <input
          v-model="newPassword"
          autocomplete="new-password"
          class="rounded-sm border border-black-300 px-3 py-2"
          minlength="8"
          name="newPassword"
          required
          type="password"
        >
      </label>

      <button
        class="rounded-sm bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
        :disabled="auth.isLoading || newPassword.length < 8"
        type="submit"
      >
        {{ auth.isLoading ? '변경 중입니다.' : '비밀번호 변경' }}
      </button>
    </form>
  </section>
</template>
