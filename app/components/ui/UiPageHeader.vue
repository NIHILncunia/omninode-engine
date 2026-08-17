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
    'p-6',
    'shadow-sm',
    'lg:flex-row',
    'lg:items-start',
    'lg:justify-between',
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
  <header
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
  >
    <div class="flex min-w-0 flex-col gap-2">
      <p class="text-xs font-700 uppercase tracking-[0.18em] text-blue-600">
        UI-0 Foundation
      </p>
      <div class="flex min-w-0 flex-col gap-1">
        <h1 class="text-h4 font-700 text-black-900">
          {{ props.title }}
        </h1>
        <p
          v-if="props.description"
          class="text-sm leading-relaxed text-black-600"
        >
          {{ props.description }}
        </p>
      </div>
    </div>

    <div
      v-if="$slots.actions"
      class="flex flex-wrap items-center gap-2"
    >
      <slot name="actions" />
    </div>
  </header>
</template>
