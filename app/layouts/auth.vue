<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { cn } from '~/utils/cn';

const cssVariants = cva([
  'min-h-dvh',
  'bg-black-50',
], {
  variants: {},
  compoundVariants: [
  ],
  defaultVariants: {},
});
</script>

<template>
  <main :class="cn([cssVariants({})])">
    <slot />
  </main>
</template>
