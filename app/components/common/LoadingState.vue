<script lang="ts" setup>
import { cva } from 'class-variance-authority';
import { cn } from '~/utils/cn';

const props = withDefaults(defineProps<{
  class?: string;
  title?: string;
  description?: string;
}>(), {
  title: '불러오는 중입니다.',
});

const cssVariants = cva(
  [
    'flex',
    'flex-col',
    'items-center',
    'gap-2',
    'p-6',
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
  <section
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
    aria-live="polite"
  >
    <p>{{ props.title }}</p>
    <p v-if="props.description">{{ props.description }}</p>
  </section>
</template>
