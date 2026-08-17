<script setup lang="ts">
import { DateTime } from 'luxon';
import { cva } from 'class-variance-authority';
import { computed } from 'vue';
import type { UiFixtureCategory, UiFixtureDocument, UiFixtureProject, UiFixtureWorld } from '~/data/ui-fixture.data';
import UiPageHeader from '~/components/ui/UiPageHeader.vue';
import UiStatePanel from '~/components/ui/UiStatePanel.vue';
import UiStatusBadge from '~/components/ui/UiStatusBadge.vue';
import { cn } from '~/utils/cn';

const props = withDefaults(defineProps<{
  class?: string;
  document?: UiFixtureDocument | null;
  project?: UiFixtureProject | null;
  world?: UiFixtureWorld | null;
  category?: UiFixtureCategory | null;
}>(), {
  class: undefined,
  document: null,
  project: null,
  world: null,
  category: null,
});

const cssVariants = cva(
  [
    'flex',
    'flex-col',
    'gap-5',
  ],
  {
    variants: {},
    compoundVariants: [
    ],
    defaultVariants: {},
  },
);

const statusLabelByValue: Record<string, string> = {
  PUBLIC: '공개',
  PRIVATE: '비공개',
  DRAFT: '초안',
  HIDDEN: '숨김',
  DELETED: '삭제',
};

const formattedUpdatedAt = computed(() => {
  if (!props.document) {
    return '-';
  }

  return DateTime.fromISO(props.document.updatedAt).toFormat('yyyy.MM.dd HH:mm');
});

const overviewItems = computed(() => {
  if (!props.document) {
    return [
    ];
  }

  return [
    {
      label: '프로젝트',
      value: props.project?.name ?? '미확인',
    },
    {
      label: '월드',
      value: props.world?.name ?? '미확인',
    },
    {
      label: '카테고리',
      value: props.category?.name ?? '미확인',
    },
    {
      label: '최종 수정',
      value: formattedUpdatedAt.value,
    },
  ];
});
</script>

<template>
  <section
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
    data-testid="document-detail"
  >
    <UiPageHeader
      :description="props.world?.description ?? 'fixture 기반 문서 상세 미리보기입니다.'"
      :title="props.document?.title ?? '문서를 찾을 수 없습니다.'"
    >
      <template
        v-if="props.document"
        #actions
      >
        <UiStatusBadge
          :label="statusLabelByValue[props.document.status] ?? props.document.status"
          :status="props.document.status"
        />
      </template>
    </UiPageHeader>

    <UiStatePanel
      v-if="!props.document"
      title="문서를 찾을 수 없습니다"
      description="현재 fixture 범위에서 요청한 문서를 찾지 못했습니다."
    />

    <template v-else>
      <UiStatePanel
        title="문서 개요"
        description="프로젝트, 월드, 카테고리 맥락을 한 번에 확인할 수 있도록 정리한 상세 패널입니다."
      >
        <div class="grid gap-3 md:grid-cols-2">
          <div
            v-for="item in overviewItems"
            :key="item.label"
            class="rounded-xl border border-black-200 bg-black-50 px-4 py-3"
          >
            <p class="text-xs font-700 uppercase tracking-[0.14em] text-black-500">
              {{ item.label }}
            </p>
            <p class="mt-1 text-sm text-black-800">
              {{ item.value }}
            </p>
          </div>
        </div>
      </UiStatePanel>

      <UiStatePanel
        title="설정 본문 미리보기"
        description="실제 Markdown 편집기 연결 전 단계이므로 fixture 정보에서 설명 문장을 구성합니다."
      >
        <p>
          {{ props.document.title }} 문서는 {{ props.category?.name ?? '미분류' }} 카테고리에 속하며
          {{ props.world?.name ?? '현재 월드' }}의 탐색 흐름에서 상세 보기 대상으로 사용됩니다.
        </p>
        <p>
          문서 편집과 저장은 다음 UI-2 단계에서 `document-editor` 레이아웃으로 이어집니다.
        </p>
      </UiStatePanel>
    </template>
  </section>
</template>
