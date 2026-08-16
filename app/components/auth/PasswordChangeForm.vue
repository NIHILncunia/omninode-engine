<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth.store';
import { cn } from '~/utils/cn';

const auth = useAuthStore();
const {
  errorMessage,
  isLoading,
} = storeToRefs(auth);
const { onChangePassword, } = auth;
const currentPassword = ref('');
const newPassword = ref('');

const cssVariants = cva([
  'mx-auto',
  'flex',
  'w-full',
  'max-w-md',
  'flex-col',
  'gap-2',
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

  const changed = await onChangePassword(currentPassword.value, newPassword.value);

  if (changed) {
    await navigateTo('/account');
  }
};
</script>

<template>
  <section class="flex min-h-dvh items-center px-4 py-8">
    <ElForm
      :class="cn([cssVariants({})])"
      label-position="top"
      @submit.prevent="onSubmitPasswordChange"
    >
      <header class="flex flex-col gap-1">
        <h1 class="text-h3 font-700">비밀번호 변경</h1>
        <p class="text-sm text-black-600">새 비밀번호는 8자 이상으로 설정해 주세요.</p>
      </header>

      <ElAlert
        v-if="errorMessage"
        :description="errorMessage"
        title="비밀번호를 변경하지 못했습니다."
        type="error"
        :closable="false"
        show-icon
      />

      <ElFormItem class="mb-0! flex flex-col items-stretch" label="현재 비밀번호">
        <ElInput
          v-model="currentPassword"
          autocomplete="current-password"
          name="currentPassword"
          required
          type="password"
          show-password
        />
      </ElFormItem>

      <ElFormItem class="mb-0! flex flex-col items-stretch" label="새 비밀번호">
        <ElInput
          v-model="newPassword"
          autocomplete="new-password"
          minlength="8"
          name="newPassword"
          required
          type="password"
          show-password
        />
      </ElFormItem>

      <ElButton
        :disabled="newPassword.length < 8"
        :loading="isLoading"
        native-type="submit"
        type="primary"
      >
        {{ isLoading ? '변경 중입니다.' : '비밀번호 변경' }}
      </ElButton>
    </ElForm>
  </section>
</template>
