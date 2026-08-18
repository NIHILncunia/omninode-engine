<script lang="ts" setup>
import { cva } from 'class-variance-authority';
import { cn } from '~/utils/cn.ts';
import { siteConfig } from '~/config/site.config.ts';

const props = defineProps<{
  class?: string;
}>();

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
  <ElContainer
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
  >
    <ElHeader class="bg-stone-800 flex flex-row items-center justify-between h-12! text-white">
      <h1>
        <UiImage
          :src="siteConfig.images.logo"
          :alt="siteConfig.images.alt"
          height="30"
        />
      </h1>
    </ElHeader>
    <ElContainer>
      <ElAside>
        aside
      </ElAside>
      <ElMain>
        <slot />
      </ElMain>
    </ElContainer>
    <ElFooter class="bg-stone-800">
      footer
    </ElFooter>
  </ElContainer>
</template>

<style scoped>

</style>
