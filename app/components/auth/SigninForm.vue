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
  'gap-1',
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
    <ElForm
      :class="cn([cssVariants({})])"
      label-position="top"
      @submit.prevent="onSubmitSignin"
    >
      <header class="flex flex-col gap-1">
        <h1 class="text-h3 font-700">관리자 로그인</h1>
        <p class="text-sm text-black-600">옴니노드 관리 환경에 로그인합니다.</p>
      </header>

      <ElAlert
        v-if="auth.errorMessage"
        :description="auth.errorMessage"
        title="로그인하지 못했습니다."
        type="error"
        :closable="false"
        show-icon
      />

      <ElFormItem class="mb-0! flex flex-col items-stretch" label="이메일">
        <ElInput
          v-model="email"
          autocomplete="email"
          name="email"
          required
          type="email"
        />
      </ElFormItem>

      <ElFormItem class="mb-0! flex flex-col items-stretch" label="비밀번호">
        <ElInput
          v-model="password"
          autocomplete="current-password"
          name="password"
          required
          type="password"
          show-password
        />
      </ElFormItem>

      <ElButton
        :loading="auth.isLoading"
        native-type="submit"
        type="primary"
      >
        {{ auth.isLoading ? '로그인 중입니다.' : '로그인' }}
      </ElButton>
    </ElForm>
  </section>
</template>
