<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { cn } from '~/utils/cn.ts';
import { ref } from 'vue';

const props = defineProps<{
  class?: string;
}>();

const test = ref(false);

const cssVariants = cva(
  [
    '',
  ],
  {
    variants: {},
    compoundVariants: [
    ],
    defaultVariants: {},
  },
);
</script>

<template>
  <div
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
  >
    content
  </div>
</template>

<style scoped>

</style>
