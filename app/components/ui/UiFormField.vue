<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { cn } from '~/utils/cn';

const props = withDefaults(defineProps<{
  class?: string;
  description?: string;
  error?: string;
  label: string;
  required?: boolean;
}>(), {
  description: undefined,
  error: undefined,
  required: false,
});

const cssVariants = cva(
  [
    'flex',
    'flex-col',
    'gap-2',
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
    <div class="flex flex-col gap-1">
      <label class="text-sm font-700 text-black-800">
        {{ props.label }}
        <span
          v-if="props.required"
          class="ml-1 text-red-600"
        >
          *
        </span>
      </label>
      <p
        v-if="props.description"
        class="text-xs leading-relaxed text-black-600"
      >
        {{ props.description }}
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <slot />
      <p
        v-if="props.error"
        class="text-xs font-600 text-red-600"
        role="alert"
      >
        {{ props.error }}
      </p>
    </div>
  </section>
</template>
