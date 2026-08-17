<script setup lang="ts">
import { DateTime } from 'luxon';
import { cva } from 'class-variance-authority';
import { computed, ref, watch } from 'vue';
import type { UiDocumentStatus, UiFixtureCategory, UiFixtureDocument } from '~/data/ui-fixture.data';
import UiPageHeader from '~/components/ui/UiPageHeader.vue';
import UiStatePanel from '~/components/ui/UiStatePanel.vue';
import UiStatusBadge from '~/components/ui/UiStatusBadge.vue';
import { cn } from '~/utils/cn';

type DocumentListMode = 'ready' | 'loading' | 'empty' | 'error';

const props = withDefaults(defineProps<{
  class?: string;
  title: string;
  description?: string;
  documents: UiFixtureDocument[];
  categories?: UiFixtureCategory[];
  selectedDocumentId?: string;
  mode?: DocumentListMode;
  getDocumentTo: (document: UiFixtureDocument) => string;
}>(), {
  class: undefined,
  description: undefined,
  categories: () => [
  ],
  selectedDocumentId: undefined,
  mode: 'ready',
});

const emit = defineEmits<{
  'update:selectedDocumentId': [value: string | undefined];
}>();

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

const titleQuery = ref('');
const selectedCategoryId = ref('ALL');
const selectedStatus = ref<'ALL' | UiDocumentStatus>('ALL');
const currentPage = ref(1);
const pageSize = 5;

const statusLabelByValue: Record<UiDocumentStatus, string> = {
  PUBLIC: '공개',
  PRIVATE: '비공개',
  DRAFT: '초안',
  HIDDEN: '숨김',
  DELETED: '삭제',
};

const categoryNameById = computed<Record<string, string>>(() => Object.fromEntries(
  props.categories.map((category) => [
    category.id,
    category.name,
  ]),
));

const categoryOptions = computed(() => [
  {
    label: '전체 카테고리',
    value: 'ALL',
  },
  ...props.categories.map((category) => ({
    label: category.name,
    value: category.id,
  })),
]);

const statusOptions = computed(() => [
  {
    label: '전체 상태',
    value: 'ALL',
  },
  ...Object.entries(statusLabelByValue).map(([
    value,
    label,
  ]) => ({
    label,
    value,
  })),
]);

const filteredDocuments = computed(() => {
  if (props.mode === 'empty') {
    return [
    ];
  }

  return props.documents.filter((document) => {
    const matchesTitle = titleQuery.value.length === 0 || document.title.toLowerCase().includes(titleQuery.value.toLowerCase());
    const matchesCategory = selectedCategoryId.value === 'ALL' || document.categoryId === selectedCategoryId.value;
    const matchesStatus = selectedStatus.value === 'ALL' || document.status === selectedStatus.value;

    return matchesTitle && matchesCategory && matchesStatus;
  });
});

const totalItems = computed(() => filteredDocuments.value.length);
const pageCount = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)));
const statusSummary = computed(() => Array.from(new Set(
  filteredDocuments.value.map((document) => statusLabelByValue[document.status] ?? document.status),
)).join(', '));
const paginatedDocuments = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize;

  return filteredDocuments.value.slice(startIndex, startIndex + pageSize);
});

watch(
  [
    titleQuery,
    selectedCategoryId,
    selectedStatus,
  ],
  () => {
    currentPage.value = 1;
  },
);

watch(
  () => filteredDocuments.value.map((document) => document.id).join('|'),
  () => {
    if (currentPage.value > pageCount.value) {
      currentPage.value = pageCount.value;
    }

    if (filteredDocuments.value.length === 0) {
      emit('update:selectedDocumentId', undefined);
      return;
    }

    const hasSelectedDocument = props.selectedDocumentId !== undefined
      && filteredDocuments.value.some((document) => document.id === props.selectedDocumentId);

    if (!hasSelectedDocument) {
      emit('update:selectedDocumentId', filteredDocuments.value[0]?.id);
    }
  },
  {
    immediate: true,
  },
);

const onSelectDocument = (document: UiFixtureDocument): void => {
  emit('update:selectedDocumentId', document.id);
};

const onChangePage = (page: number): void => {
  currentPage.value = page;
};

const formatDateTime = (value: string): string => DateTime.fromISO(value).toFormat('yyyy.MM.dd HH:mm');
</script>

<template>
  <section
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
  >
    <UiPageHeader
      :description="props.description"
      :title="props.title"
    >
      <template #actions>
        <UiStatusBadge
          label="Fixture"
          status="ACTIVE"
        />
      </template>
    </UiPageHeader>

    <UiStatePanel
      v-if="props.mode === 'loading'"
      title="문서를 불러오는 중입니다"
      description="fixture 상태를 기준으로 문서 목록을 준비하고 있습니다."
    />

    <UiStatePanel
      v-else-if="props.mode === 'error'"
      title="문서 목록을 불러오지 못했습니다"
      description="실제 API 연결 전 단계이므로 query state로 오류 패널을 점검합니다."
    />

    <template v-else>
      <div class="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <ElInput
          v-model="titleQuery"
          name="documentTitleQuery"
          placeholder="문서 제목 검색"
        />

        <ElSelect
          v-model="selectedCategoryId"
          placeholder="카테고리"
        >
          <ElOption
            v-for="option in categoryOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>

        <ElSelect
          v-model="selectedStatus"
          placeholder="상태"
        >
          <ElOption
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </div>

      <UiStatePanel
        v-if="filteredDocuments.length === 0"
        title="조건에 맞는 문서가 없습니다"
        description="제목·카테고리·상태 필터를 조정해 다른 fixture 문서를 확인할 수 있습니다."
      />

      <template v-else>
        <div
          data-testid="document-table"
          class="overflow-hidden rounded-2xl border border-black-200 bg-white shadow-sm"
        >
          <div class="border-b border-black-200 px-4 py-3 text-xs text-black-500">
            현재 결과 {{ totalItems }}건 · 상태 {{ statusSummary }}
          </div>

          <ElTable
            :data="paginatedDocuments"
            row-key="id"
            @row-click="onSelectDocument"
          >
            <ElTableColumn
              label="문서"
              min-width="240"
            >
              <template #default="{ row }">
                <div class="flex flex-col gap-1 py-1">
                  <NuxtLink
                    :href="props.getDocumentTo(row)"
                    :to="props.getDocumentTo(row)"
                    class="text-sm font-700 text-black-900"
                  >
                    {{ row.title }}
                  </NuxtLink>
                  <span class="text-xs text-black-500">
                    {{ categoryNameById[row.categoryId] ?? '미분류' }}
                  </span>
                </div>
              </template>
            </ElTableColumn>

            <ElTableColumn
              label="상태"
              min-width="120"
            >
              <template #default="{ row }">
                <UiStatusBadge
                  :label="statusLabelByValue[row.status]"
                  :status="row.status"
                />
              </template>
            </ElTableColumn>

            <ElTableColumn
              label="최종 수정"
              min-width="160"
            >
              <template #default="{ row }">
                <span class="text-sm text-black-700">
                  {{ formatDateTime(row.updatedAt) }}
                </span>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>

        <div class="flex justify-end">
          <ElPagination
            background
            layout="prev, pager, next"
            :current-page="currentPage"
            :page-size="pageSize"
            :total="totalItems"
            @current-change="onChangePage"
          />
        </div>
      </template>
    </template>
  </section>
</template>
