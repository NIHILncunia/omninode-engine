<script setup lang="ts">
import { DateTime } from 'luxon';
import { cva } from 'class-variance-authority';
import { computed } from 'vue';
import type { UiFixtureCategory, UiFixtureDocument, UiFixtureProject, UiFixtureWorld } from '~/data/ui-fixture.data';
import type { DocumentViewMode, RelatedRouteItem } from '~/components/docs/document-route.shared';
import UiStatePanel from '~/components/ui/UiStatePanel.vue';
import UiStatusBadge from '~/components/ui/UiStatusBadge.vue';
import { cn } from '~/utils/cn';

const props = withDefaults(defineProps<{
  class?: string;
  document?: UiFixtureDocument | null;
  project?: UiFixtureProject | null;
  world?: UiFixtureWorld | null;
  category?: UiFixtureCategory | null;
  relatedRoutes?: RelatedRouteItem[];
  mode?: DocumentViewMode;
}>(), {
  class: undefined,
  document: null,
  project: null,
  world: null,
  category: null,
  relatedRoutes: () => [
  ],
  mode: 'ready',
});

const cssVariants = cva(
  [
    'flex',
    'flex-col',
    'gap-4',
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

const metadataRows = computed(() => {
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
      value: DateTime.fromISO(props.document.updatedAt).toFormat('yyyy.MM.dd HH:mm'),
    },
  ];
});
</script>

<template>
  <aside
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
    data-testid="document-meta-panel"
  >
    <UiStatePanel
      v-if="props.mode === 'loading'"
      title="메타 패널을 준비하는 중입니다"
      description="문서 우측 패널의 상태 전환을 fixture query로 점검합니다."
    />

    <UiStatePanel
      v-else-if="props.mode === 'error'"
      title="메타 패널을 표시하지 못했습니다"
      description="실제 API 연결 전 단계이므로 오류 패널만 노출합니다."
    />

    <UiStatePanel
      v-else-if="!props.document || props.mode === 'empty'"
      title="선택된 문서가 없습니다"
      description="목록에서 다른 문서를 선택하면 메타 정보와 관련 라우트가 이 패널에 표시됩니다."
    />

    <template v-else>
      <UiStatePanel
        title="문서 메타"
        description="최종 수정과 현재 탐색 범위를 요약한 우측 패널입니다."
      >
        <template #badge>
          <UiStatusBadge
            :label="statusLabelByValue[props.document.status] ?? props.document.status"
            :status="props.document.status"
          />
        </template>

        <dl class="flex flex-col gap-3">
          <div
            v-for="row in metadataRows"
            :key="row.label"
            class="flex flex-col gap-1 rounded-xl border border-black-200 bg-black-50 px-4 py-3"
          >
            <dt class="text-xs font-700 uppercase tracking-[0.14em] text-black-500">
              {{ row.label }}
            </dt>
            <dd class="text-sm text-black-800">
              {{ row.value }}
            </dd>
          </div>
        </dl>
      </UiStatePanel>

      <UiStatePanel
        title="관련 라우트"
        description="목록·상세·관계 표현 페이지를 fixture 경로 조합으로 검증합니다."
      >
        <div class="flex flex-col gap-2">
          <NuxtLink
            v-for="routeItem in props.relatedRoutes"
            :key="routeItem.to"
            :href="routeItem.to"
            :to="routeItem.to"
            class="rounded-xl border border-black-200 px-4 py-3 text-sm text-black-800 transition-colors hover:bg-black-50"
          >
            {{ routeItem.label }}
          </NuxtLink>
        </div>
      </UiStatePanel>
    </template>
  </aside>
</template>
