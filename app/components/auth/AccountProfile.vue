<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/stores/auth.store';
import { cn } from '~/utils/cn';

const props = defineProps<{
  class?: string;
}>();

const auth = useAuthStore();
const {
  admin,
  isLoading,
  status,
} = storeToRefs(auth);
const { onSignOut, } = auth;

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
  await onSignOut();
  await navigateTo('/signin');
};
</script>

<template>
  <section
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
  >
    <header class="flex flex-col gap-1">
      <h1 class="text-h3 font-700">내 계정</h1>
      <p class="text-sm text-black-600">현재 로그인한 관리자 정보입니다.</p>
    </header>

    <ElSkeleton v-if="status === 'unknown'" :rows="3" animated />

    <template v-else-if="admin">
      <ElDescriptions :column="1" border>
        <ElDescriptionsItem label="이름">{{ admin.name }}</ElDescriptionsItem>
        <ElDescriptionsItem label="이메일">{{ admin.email }}</ElDescriptionsItem>
        <ElDescriptionsItem label="역할">{{ admin.role }}</ElDescriptionsItem>
      </ElDescriptions>

      <ElButton
        :loading="isLoading"
        plain
        type="info"
        @click="onClickSignOut"
      >
        로그아웃
      </ElButton>
    </template>
  </section>
</template>
