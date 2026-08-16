<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/stores/auth.store';
import { cn } from '~/utils/cn';

const props = defineProps<{
  class?: string;
}>();

const auth = useAuthStore();
const { admin, } = storeToRefs(auth);

const onClickAdminSignin = (): void => {
  void navigateTo('/signin');
};

const cssVariants = cva([
  'flex flex-row items-end gap-2',
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
    :class="cn(
      cssVariants({}),
      props.class
    )"
  >
    <div class="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70">
      <UiIcon icon-name="lucide:user-round" class="size-5" />
    </div>

    <div class="flex min-w-0 flex-col">
      <strong class="max-w-48 truncate text-sm font-600 leading-tight text-white">
        {{ admin.name }}
      </strong>

      <span class="max-w-48 truncate text-xs leading-tight text-white/50">
        {{ admin.email }}
      </span>
    </div>
  </div>
  <ElButton
    v-else
    native-type="button"
    type="primary"
    :class="cn([
      'bg-stone-800! border-stone-700! text-white! shadow-md hover:bg-blue-500! hover:border-blue-500! focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900',
      props.class,
    ])"
    @click="onClickAdminSignin"
  >
    <UiIcon icon-name="lucide:settings" class="mr-1 size-4" />
    관리자 로그인
  </ElButton>
</template>
