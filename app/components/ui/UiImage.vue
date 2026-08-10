<script lang="ts" setup>
import { cva } from 'class-variance-authority';
import { cn } from '~/utils/cn.ts';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<{
  class?: string;

  src: string;
  alt: string;

  width?: number | string;
  height?: number | string;

  loading?: 'eager' | 'lazy';
  decoding?: 'async' | 'sync' | 'auto';
  fetchpriority?: 'high' | 'low' | 'auto';

  sizes?: string;
  densities?: string;

  format?: string;
  quality?: number | string;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: string;

  placeholder?:
    | boolean
    | string
    | number
    | [w: number, h: number, q?: number, b?: number];
  preload?: boolean;
}>(), {
  loading: 'lazy',
  decoding: 'async',
  fetchpriority: 'auto',
});

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
  <NuxtImg
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
    v-bind="$attrs"
    :src="props.src"
    :alt="props.alt"
    :width="props.width"
    :height="props.height"
    :loading="props.loading"
    :decoding="props.decoding"
    :fetchpriority="props.fetchpriority"
    :sizes="props.sizes"
    :densities="props.densities"
    :format="props.format"
    :quality="props.quality"
    :fit="props.fit"
    :position="props.position"
    :placeholder="props.placeholder"
    :preload="props.preload"
  />
</template>

<style scoped>

</style>
