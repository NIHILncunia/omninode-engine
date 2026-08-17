<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { cn } from '~/utils/cn';

const props = withDefaults(defineProps<{
  class?: string;
  mode: 'create' | 'edit';
  projectName?: string;
  worldName?: string;
  templateName?: string;
  title?: string;
  saveFeedback?: string;
  sectionHeadings?: string[];
}>(), {
  class: undefined,
  projectName: '미확인 프로젝트',
  worldName: '미확인 월드',
  templateName: '미선택 템플릿',
  title: '새 설정 문서',
  saveFeedback: '아직 저장 준비를 실행하지 않았습니다.',
  sectionHeadings: () => [
  ],
});

const cssVariants = cva(
  [
    'flex',
    'flex-col',
    'gap-4',
    'rounded-2xl',
    'border',
    'border-black-200',
    'bg-black-50',
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
    data-testid="document-outline"
  >
    <div class="flex flex-col gap-1">
      <p class="text-xs font-700 uppercase tracking-[0.18em] text-blue-600">
        {{ props.mode === 'create' ? '새 문서' : '문서 편집' }}
      </p>
      <h2 class="text-lg font-700 text-black-900">
        {{ props.title }}
      </h2>
      <p class="text-sm leading-relaxed text-black-600">
        {{ props.projectName }} · {{ props.worldName }}
      </p>
    </div>

    <section class="rounded-xl border border-black-200 bg-white px-4 py-3">
      <p class="text-xs font-700 uppercase tracking-[0.14em] text-black-500">
        템플릿
      </p>
      <p class="mt-1 text-sm text-black-800">
        {{ props.templateName }}
      </p>
    </section>

    <section class="flex flex-col gap-2 rounded-xl border border-black-200 bg-white px-4 py-3">
      <p class="text-xs font-700 uppercase tracking-[0.14em] text-black-500">
        목차
      </p>
      <ol class="flex flex-col gap-2 text-sm text-black-800">
        <li
          v-for="sectionHeading in props.sectionHeadings"
          :key="sectionHeading"
        >
          {{ sectionHeading }}
        </li>
      </ol>
    </section>

    <section class="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
      <p class="text-xs font-700 uppercase tracking-[0.14em] text-blue-700">
        저장 상태
      </p>
      <p
        class="mt-1 text-sm text-blue-900"
        data-testid="save-feedback"
      >
        {{ props.saveFeedback }}
      </p>
    </section>
  </aside>
</template>
