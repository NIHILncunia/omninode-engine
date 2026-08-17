<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { cn } from '~/utils/cn';

const props = withDefaults(defineProps<{
  class?: string;
  label?: string;
  status: string;
}>(), {
  label: undefined,
});

const cssVariants = cva(
  [
    'inline-flex',
    'items-center',
    'rounded-full',
    'border',
    'px-2.5',
    'py-1',
    'text-xs',
    'font-700',
  ],
  {
    variants: {
      tone: {
        neutral: 'border-black-200 bg-black-100 text-black-700',
        success: 'border-green-200 bg-green-50 text-green-700',
        warning: 'border-amber-200 bg-amber-50 text-amber-700',
        danger: 'border-red-200 bg-red-50 text-red-700',
        info: 'border-blue-200 bg-blue-50 text-blue-700',
      },
    },
    compoundVariants: [
    ],
    defaultVariants: {
      tone: 'neutral',
    },
  },
);

const toneByStatus: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  ACTIVE: 'success',
  ARCHIVED: 'neutral',
  PENDING: 'warning',
  PUBLIC: 'success',
  PRIVATE: 'info',
  DRAFT: 'warning',
  HIDDEN: 'neutral',
  DELETED: 'danger',
};
</script>

<template>
  <span
    :class="cn([
      cssVariants({
        tone: toneByStatus[props.status] ?? 'neutral',
      }),
      props.class,
    ])"
  >
    {{ props.label ?? props.status }}
  </span>
</template>
