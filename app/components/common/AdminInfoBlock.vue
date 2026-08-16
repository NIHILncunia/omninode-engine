<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/stores/auth.store';
import { cn } from '~/utils/cn';

const auth = useAuthStore();
const { admin, } = storeToRefs(auth);

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
</template>
