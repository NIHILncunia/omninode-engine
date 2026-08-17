<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { cn } from '~/utils/cn';

const props = withDefaults(defineProps<{
  class?: string;
  title: string;
  description?: string;
}>(), {
  description: undefined,
});

const cssVariants = cva(
  [
    'flex',
    'flex-col',
    'gap-4',
    'rounded-2xl',
    'border',
    'border-black-200',
    'bg-white',
    'p-5',
    'shadow-sm',
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
  >
    <header class="flex flex-col gap-1">
      <div
        v-if="$slots.badge"
        class="flex items-center gap-2"
      >
        <slot name="badge" />
      </div>
      <h2 class="text-lg font-700 text-black-900">
        {{ props.title }}
      </h2>
      <p
        v-if="props.description"
        class="text-sm leading-relaxed text-black-600"
      >
        {{ props.description }}
      </p>
    </header>

    <div class="flex flex-col gap-3 text-sm text-black-700">
      <slot />
    </div>
  </section>
</template>
