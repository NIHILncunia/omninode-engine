<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { cn } from '~/utils/cn';

const cssVariants = cva([
  'min-h-dvh',
  'bg-black-50',
  'text-black-900',
], {
  variants: {},
  compoundVariants: [
  ],
  defaultVariants: {},
});
</script>

<template>
  <main :class="cn([cssVariants({})])">
    <AppHeader
      class="border-b-0"
      description="로그인 및 계정 보호 컨텍스트"
      title="옴니노드 인증"
    />
    <section class="flex min-h-[calc(100dvh-72px)] items-center justify-center px-4 py-8">
      <slot />
    </section>
  </main>
</template>
