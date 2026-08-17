<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { computed } from 'vue';
import { uiFixture } from '~/data/ui-fixture.data';
import { cn } from '~/utils/cn';

const props = withDefaults(defineProps<{
  class?: string;
  currentDocumentId?: string;
  worldId?: string;
}>(), {
  class: undefined,
  currentDocumentId: undefined,
  worldId: 'world-luxtera',
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

const categories = computed(() => uiFixture.categories.filter((category) => category.worldId === props.worldId));
const documents = computed(() => uiFixture.documents.filter((document) => document.worldId === props.worldId));
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
        문서 편집
      </p>
      <h2 class="text-lg font-700 text-black-900">
        카테고리와 문서
      </h2>
      <p class="text-sm leading-relaxed text-black-600">
        현재 월드의 카테고리 구조와 대표 문서를 fixture 기준으로 탐색합니다.
      </p>
    </div>

    <section class="flex flex-col gap-2">
      <h3 class="text-sm font-700 text-black-800">
        카테고리
      </h3>
      <ul class="flex flex-col gap-2">
        <li
          v-for="category in categories"
          :key="category.id"
          class="rounded-xl border border-black-200 bg-black-50 px-3 py-2"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm text-black-800">
              {{ category.name }}
            </span>
            <span class="text-xs text-black-500">
              {{ category.depth }}단계
            </span>
          </div>
        </li>
      </ul>
    </section>

    <section class="flex min-h-0 flex-col gap-2">
      <h3 class="text-sm font-700 text-black-800">
        문서
      </h3>
      <div class="flex flex-col gap-2 overflow-y-auto">
        <NuxtLink
          v-for="document in documents"
          :key="document.id"
          to="/docs"
          :class="cn([
            'flex items-center justify-between gap-2 rounded-xl border px-3 py-2 transition-colors',
            document.id === (props.currentDocumentId ?? documents[0]?.id)
              ? 'border-blue-200 bg-blue-50'
              : 'border-black-200 bg-white hover:bg-black-50',
          ])"
        >
          <span class="min-w-0 truncate text-sm text-black-800">
            {{ document.title }}
          </span>
          <UiStatusBadge
            :label="document.status"
            :status="document.status"
          />
        </NuxtLink>
      </div>
    </section>
  </aside>
</template>
