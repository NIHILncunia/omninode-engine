<script setup lang="ts">
import { DateTime } from 'luxon';
import { cva } from 'class-variance-authority';
import { computed } from 'vue';
import { uiFixture, type UiDocumentStatus } from '~/data/ui-fixture.data';
import UiPageHeader from '~/components/ui/UiPageHeader.vue';
import UiStatePanel from '~/components/ui/UiStatePanel.vue';
import UiStatusBadge from '~/components/ui/UiStatusBadge.vue';
import { cn } from '~/utils/cn';

const props = withDefaults(defineProps<{
  class?: string;
}>(), {
  class: undefined,
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

const documentStatusLabels: Record<UiDocumentStatus, string> = {
  PUBLIC: '공개',
  PRIVATE: '비공개',
  DRAFT: '초안',
  HIDDEN: '숨김',
  DELETED: '삭제',
};

const categoryNameById = computed<Record<string, string>>(() => Object.fromEntries(
  uiFixture.categories.map((category) => [
    category.id,
    category.name,
  ]),
));

const worldNameById = computed<Record<string, string>>(() => Object.fromEntries(
  uiFixture.worlds.map((world) => [
    world.id,
    world.name,
  ]),
));

const projectNameByWorldId = computed<Record<string, string>>(() => Object.fromEntries(
  uiFixture.worlds.map((world) => [
    world.id,
    uiFixture.projects.find((project) => project.worldIds.includes(world.id))?.name ?? '미분류 프로젝트',
  ]),
));

const totalHiddenDocuments = computed(() => uiFixture.documents.filter((document) => document.status === 'HIDDEN').length);

const dashboardKpis = computed(() => [
  {
    label: '전체 프로젝트',
    value: String(uiFixture.projects.length),
    detail: `활성 ${uiFixture.projects.filter((project) => project.status === 'ACTIVE').length} · 보관 ${uiFixture.projects.filter((project) => project.status === 'ARCHIVED').length}`,
    status: 'ACTIVE',
  },
  {
    label: '활성 월드',
    value: String(uiFixture.worlds.filter((world) => world.status === 'ACTIVE').length),
    detail: `대기 ${uiFixture.worlds.filter((world) => world.status === 'PENDING').length} · 보관 ${uiFixture.worlds.filter((world) => world.status === 'ARCHIVED').length}`,
    status: 'ACTIVE',
  },
  {
    label: '문서 상태',
    value: String(uiFixture.documents.length),
    detail: `공개 ${uiFixture.documents.filter((document) => document.status === 'PUBLIC').length} · 숨김 ${totalHiddenDocuments.value}`,
    status: 'ACTIVE',
  },
  {
    label: '전역 관리자',
    value: String(uiFixture.admins.length),
    detail: `슈퍼 어드민 ${uiFixture.admins.filter((admin) => admin.role === 'SUPER_ADMIN').length} · 프로젝트 관리자 ${uiFixture.admins.filter((admin) => admin.role === 'ADMIN').length}`,
    status: 'ACTIVE',
  },
]);

const recentDocuments = computed(() => [
  ...uiFixture.documents,
].sort((left, right) => DateTime.fromISO(right.updatedAt).toMillis() - DateTime.fromISO(left.updatedAt).toMillis()).slice(0, 5).map((document) => {
  const isHidden = document.status === 'HIDDEN';

  return {
    id: document.id,
    title: isHidden ? '숨김 문서' : document.title,
    category: isHidden ? '비공개 카테고리' : categoryNameById.value[document.categoryId] ?? '미분류',
    project: projectNameByWorldId.value[document.worldId] ?? '미분류 프로젝트',
    world: worldNameById.value[document.worldId] ?? '미확인 월드',
    status: document.status,
    statusLabel: documentStatusLabels[document.status],
    updatedAt: DateTime.fromISO(document.updatedAt).toFormat('yyyy.MM.dd HH:mm'),
    note: isHidden
      ? '민감한 제목과 카테고리는 redaction된 라벨로만 노출합니다.'
      : '전역 대시보드에서 최근 수정 흐름을 빠르게 검토할 수 있습니다.',
  };
}));

const adminSnapshot = computed(() => uiFixture.admins.map((admin) => ({
  id: admin.id,
  name: admin.name,
  roleLabel: admin.role === 'SUPER_ADMIN' ? '슈퍼 어드민' : '프로젝트 관리자',
  projectSummary: admin.projectIds.map((projectId) => uiFixture.projects.find((project) => project.id === projectId)?.name ?? projectId).join(', '),
  lastSignedInAt: DateTime.fromISO(admin.lastSignedInAt).toFormat('yyyy.MM.dd HH:mm'),
  status: admin.status,
})));
</script>

<template>
  <section
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
  >
    <UiPageHeader
      description="프로젝트, 월드, 문서, 관리자 현황을 fixture 기반으로 한 화면에서 점검합니다."
      title="슈퍼 어드민 대시보드"
    >
      <template #actions>
        <NuxtLink
          class="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-700 text-blue-700"
          to="/admins"
        >
          관리자 관리 열기
        </NuxtLink>
      </template>
    </UiPageHeader>

    <div
      data-testid="system-kpi"
      class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      <article
        v-for="kpi in dashboardKpis"
        :key="kpi.label"
        class="flex flex-col gap-3 rounded-2xl border border-black-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-700 uppercase tracking-[0.14em] text-black-500">
              {{ kpi.label }}
            </p>
            <p class="mt-2 text-h3 font-700 text-black-900">
              {{ kpi.value }}
            </p>
          </div>
          <UiStatusBadge
            label="Fixture"
            :status="kpi.status"
          />
        </div>
        <p class="text-sm leading-relaxed text-black-600">
          {{ kpi.detail }}
        </p>
      </article>
    </div>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <UiStatePanel
        data-testid="recent-documents"
        description="최근 수정 문서에는 숨김 문서가 포함되지만 민감한 제목과 카테고리는 redaction된 라벨로만 보여줍니다."
        title="최근 변경 문서"
      >
        <article
          v-for="document in recentDocuments"
          :key="document.id"
          class="rounded-2xl border border-black-200 bg-black-50 px-4 py-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <UiStatusBadge
                :label="document.statusLabel"
                :status="document.status"
              />
              <span class="text-xs text-black-500">
                {{ document.updatedAt }}
              </span>
            </div>
            <span class="text-xs font-700 uppercase tracking-[0.14em] text-black-500">
              {{ document.project }}
            </span>
          </div>

          <p class="mt-3 text-sm font-700 text-black-900">
            {{ document.title }}
          </p>
          <p class="mt-1 text-xs text-black-500">
            {{ document.world }} · {{ document.category }}
          </p>
          <p class="mt-3 text-sm leading-relaxed text-black-600">
            {{ document.note }}
          </p>
        </article>
      </UiStatePanel>

      <UiStatePanel
        description="전역 관리 계정의 최근 로그인과 담당 프로젝트 범위를 요약합니다."
        title="관리자 스냅샷"
      >
        <article
          v-for="admin in adminSnapshot"
          :key="admin.id"
          class="rounded-2xl border border-black-200 bg-black-50 px-4 py-4"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-700 text-black-900">
                {{ admin.name }}
              </p>
              <p class="mt-1 text-xs text-black-500">
                {{ admin.roleLabel }}
              </p>
            </div>
            <UiStatusBadge
              :label="admin.status"
              :status="admin.status"
            />
          </div>

          <p class="mt-3 text-sm text-black-700">
            담당 프로젝트: {{ admin.projectSummary }}
          </p>
          <p class="mt-1 text-xs text-black-500">
            마지막 로그인 {{ admin.lastSignedInAt }}
          </p>
        </article>
      </UiStatePanel>
    </div>
  </section>
</template>
