<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/stores/auth.store';
import { cn } from '~/utils/cn';

const auth = useAuthStore();
const { admin, } = storeToRefs(auth);

const onClickAdminSignin = (): void => {
  void navigateTo('/signin');
};

const cssVariants = cva([
  'flex flex-col items-end gap-1',
], {
  variants: {},
  compoundVariants: [
  ],
  defaultVariants: {},
});
</script>

<template>
  <div
    v-if="admin"
    :class="cn([cssVariants({})])"
  >
    <span class="text-md">
      <strong class="font-600">{{ admin.name }}</strong> ({{ admin.email }})
    </span>
  </div>
  <ElButton
    v-else
    native-type="button"
    type="primary"
    class="bg-stone-800! border-stone-700! text-white! shadow-md hover:bg-blue-500! hover:border-blue-500! focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
    @click="onClickAdminSignin"
  >
    <UiIcon icon-name="lucide:settings" class="mr-1 size-4" />
    관리자 로그인
  </ElButton>
</template>
