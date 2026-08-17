<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { cn } from '~/utils/cn';

interface DashboardSidebarLink {
  badge?: string;
  description?: string;
  label: string;
  to: string;
}

const props = withDefaults(defineProps<{
  class?: string;
  description?: string;
  links: DashboardSidebarLink[];
  title: string;
}>(), {
  class: undefined,
  description: undefined,
});

const cssVariants = cva(
  [
    'flex',
    'h-full',
    'flex-col',
    'gap-5',
    'bg-white',
    'p-5',
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
  <aside
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
  >
    <div class="flex flex-col gap-1">
      <p class="text-xs font-700 uppercase tracking-[0.18em] text-blue-600">
        Dashboard
      </p>
      <h2 class="text-lg font-700 text-black-900">
        {{ props.title }}
      </h2>
      <p
        v-if="props.description"
        class="text-sm leading-relaxed text-black-600"
      >
        {{ props.description }}
      </p>
    </div>

    <nav
      aria-label="대시보드 탐색"
      class="flex flex-col gap-2"
    >
      <NuxtLink
        v-for="link in props.links"
        :key="link.to"
        :to="link.to"
        class="flex items-center justify-between gap-3 rounded-xl border border-black-200 bg-black-50 px-3 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50"
      >
        <div class="flex min-w-0 flex-col gap-1">
          <span class="truncate text-sm font-700 text-black-900">
            {{ link.label }}
          </span>
          <span
            v-if="link.description"
            class="truncate text-xs text-black-600"
          >
            {{ link.description }}
          </span>
        </div>
        <UiStatusBadge
          v-if="link.badge"
          :label="link.badge"
          status="ACTIVE"
        />
      </NuxtLink>
    </nav>
  </aside>
</template>
