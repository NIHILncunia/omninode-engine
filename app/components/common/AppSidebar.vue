<script lang="ts" setup>
import { cva } from 'class-variance-authority';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { siteConfig } from '~/config/site.config';
import { useAuthStore } from '~/stores/auth.store';
import type { NavigationItem } from '~/types/common.types';
import { cn } from '~/utils/cn';

const props = defineProps<{
  class?: string;
}>();
const auth = useAuthStore();
const { admin, } = storeToRefs(auth);
const navigationItems = computed(() => admin.value?.role === 'SUPER_ADMIN'
  ? [
    ...siteConfig.navigation,
    {
      label: '관리자',
      to: '/admins',
    },
  ]
  : siteConfig.navigation);

const emit = defineEmits<{
  navigate: [item: NavigationItem];
}>();

const cssVariants = cva(
  [
    'h-full',
  ],
  {
    variants: {},
    compoundVariants: [
    ],
    defaultVariants: {},
  },
);

const onNavigate = (item: NavigationItem): void => {
  emit('navigate', item);
};
</script>

<template>
  <nav
    aria-label="주요 메뉴"
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
  >
    <ElMenu>
      <ElMenuItem
        v-for="item in navigationItems"
        :key="item.to"
        :index="item.to"
      >
        <NuxtLink
          :to="item.to"
          class="flex items-center gap-2"
          @click="onNavigate(item)"
        >
          <UiIcon
            v-if="item.icon"
            :icon-name="item.icon"
          />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </ElMenuItem>
    </ElMenu>
  </nav>
</template>
