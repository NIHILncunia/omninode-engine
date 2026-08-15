<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { useAuthStore } from '~/stores/auth.store';
import { cn } from '~/utils/cn';

const auth = useAuthStore();

const cssVariants = cva([
  'flex',
  'max-w-xl',
  'flex-col',
  'gap-5',
  'rounded-md',
  'border',
  'border-black-300',
  'bg-white',
  'p-6',
], {
  variants: {},
  compoundVariants: [
  ],
  defaultVariants: {},
});

const onClickSignOut = async (): Promise<void> => {
  await auth.onSignOut();
  await navigateTo('/signin');
};
</script>

<template>
  <section :class="cn([cssVariants({})])">
    <header class="flex flex-col gap-1">
      <h1 class="text-h3 font-700">내 계정</h1>
      <p class="text-sm text-black-600">현재 로그인한 관리자 정보입니다.</p>
    </header>

    <ElSkeleton v-if="auth.status === 'unknown'" :rows="3" animated />

    <template v-else-if="auth.admin">
      <ElDescriptions :column="1" border>
        <ElDescriptionsItem label="이름">{{ auth.admin.name }}</ElDescriptionsItem>
        <ElDescriptionsItem label="이메일">{{ auth.admin.email }}</ElDescriptionsItem>
        <ElDescriptionsItem label="역할">{{ auth.admin.role }}</ElDescriptionsItem>
      </ElDescriptions>

      <ElButton
        :loading="auth.isLoading"
        plain
        type="info"
        @click="onClickSignOut"
      >
        로그아웃
      </ElButton>
    </template>
  </section>
</template>
