<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { siteConfig } from '#imports';
import { cn } from '~/utils/cn';

const props = withDefaults(defineProps<{
  class?: string;
  description?: string;
  panelToggleLabel?: string;
  showPanelToggle?: boolean;
  showSidebarToggle?: boolean;
  sidebarToggleLabel?: string;
  title?: string;
}>(), {
  class: undefined,
  description: undefined,
  panelToggleLabel: '상태 패널 열기',
  showPanelToggle: false,
  showSidebarToggle: false,
  sidebarToggleLabel: '사이드바 열기',
  title: '옴니노드',
});

const emit = defineEmits<{
  togglePanel: [];
  toggleSidebar: [];
}>();

const cssVariants = cva(
  [
    'sticky',
    'top-0',
    'z-20',
    'border-b',
    'border-black-200',
    'bg-white/90',
    'backdrop-blur',
  ],
  {
    variants: {},
    compoundVariants: [
    ],
    defaultVariants: {},
  },
);

const onToggleSidebar = (): void => {
  emit('toggleSidebar');
};

const onTogglePanel = (): void => {
  emit('togglePanel');
};
</script>

<template>
  <header
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
  >
    <div class="flex items-center gap-3 px-4 py-3 lg:px-6">
      <ElButton
        v-if="props.showSidebarToggle"
        circle
        :aria-label="props.sidebarToggleLabel"
        native-type="button"
        plain
        @click="onToggleSidebar"
      >
        <UiIcon icon-name="lucide:panel-left" />
      </ElButton>

      <NuxtLink
        to="/docs"
        class="flex min-w-0 items-center gap-3"
      >
        <UiImage
          :src="siteConfig.images.logo"
          alt="옴니노드 로고 이미지"
          loading="lazy"
          height="36"
          width="36"
        />
        <div class="flex min-w-0 flex-col">
          <strong class="truncate text-sm font-700 text-black-900">
            {{ props.title }}
          </strong>
          <span
            v-if="props.description"
            class="truncate text-xs text-black-600"
          >
            {{ props.description }}
          </span>
        </div>
      </NuxtLink>

      <div class="ml-auto flex items-center gap-2">
        <slot name="actions" />
        <ElButton
          v-if="props.showPanelToggle"
          circle
          :aria-label="props.panelToggleLabel"
          native-type="button"
          plain
          @click="onTogglePanel"
        >
          <UiIcon icon-name="lucide:panel-right" />
        </ElButton>
        <AdminInfoBlock />
      </div>
    </div>
  </header>
</template>
