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

    <LoadingState v-if="auth.status === 'unknown'" />

    <template v-else-if="auth.admin">
      <dl class="grid gap-3">
        <div>
          <dt class="text-sm text-black-600">이름</dt>
          <dd>{{ auth.admin.name }}</dd>
        </div>
        <div>
          <dt class="text-sm text-black-600">이메일</dt>
          <dd>{{ auth.admin.email }}</dd>
        </div>
        <div>
          <dt class="text-sm text-black-600">역할</dt>
          <dd>{{ auth.admin.role }}</dd>
        </div>
      </dl>

      <button
        class="w-fit rounded-sm border border-black-400 px-4 py-2"
        :disabled="auth.isLoading"
        type="button"
        @click="onClickSignOut"
      >
        로그아웃
      </button>
    </template>
  </section>
</template>
