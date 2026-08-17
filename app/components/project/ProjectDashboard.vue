<script setup lang="ts">
import { DateTime } from 'luxon';
import { cva } from 'class-variance-authority';
import { computed } from 'vue';
import { uiFixture } from '~/data/ui-fixture.data';
import UiPageHeader from '~/components/ui/UiPageHeader.vue';
import UiStatePanel from '~/components/ui/UiStatePanel.vue';
import UiStatusBadge from '~/components/ui/UiStatusBadge.vue';
import { cn } from '~/utils/cn';

const props = withDefaults(defineProps<{
  class?: string;
  projectId?: string;
}>(), {
  class: undefined,
  projectId: undefined,
});

const route = useRoute();

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

const resolvedProjectId = computed(() => props.projectId ?? String(route.params.projectId ?? uiFixture.projects[0]?.id ?? ''));
const project = computed(() => uiFixture.projects.find((item) => item.id === resolvedProjectId.value) ?? uiFixture.projects[0] ?? null);
const projectWorlds = computed(() => project.value ? uiFixture.worlds.filter((world) => world.projectId === project.value?.id) : [
]);
const projectDocuments = computed(() => uiFixture.documents.filter((document) => projectWorlds.value.some((world) => world.id === document.worldId)));
const projectAdmins = computed(() => project.value ? uiFixture.admins.filter((admin) => admin.projectIds.includes(project.value?.id ?? '')) : [
]);

const latestDocuments = computed(() => [
  ...projectDocuments.value,
].sort((left, right) => DateTime.fromISO(right.updatedAt).toMillis() - DateTime.fromISO(left.updatedAt).toMillis()).slice(0, 4));

const kpis = computed(() => [
  {
    label: '월드',
    value: String(projectWorlds.value.length),
    detail: `활성 ${projectWorlds.value.filter((world) => world.status === 'ACTIVE').length} · 대기 ${projectWorlds.value.filter((world) => world.status === 'PENDING').length}`,
  },
  {
    label: '문서',
    value: String(projectDocuments.value.length),
    detail: `공개 ${projectDocuments.value.filter((document) => document.status === 'PUBLIC').length} · 초안 ${projectDocuments.value.filter((document) => document.status === 'DRAFT').length}`,
  },
  {
    label: '관리자',
    value: String(projectAdmins.value.length),
    detail: '프로젝트 범위에 배정된 운영 계정',
  },
]);
</script>

<template>
  <section
    v-if="project"
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
  >
    <UiPageHeader
      :description="project.description"
      :title="project.name"
    >
      <template #actions>
        <UiStatusBadge
          :label="project.status"
          :status="project.status"
        />
      </template>
    </UiPageHeader>

    <div
      data-testid="project-context"
      class="rounded-2xl border border-blue-100 bg-blue-50 p-5"
    >
      <p class="text-xs font-700 uppercase tracking-[0.14em] text-blue-700">
        프로젝트 컨텍스트
      </p>
      <p class="mt-2 text-lg font-700 text-black-900">
        {{ project.name }}
      </p>
      <p class="mt-1 text-sm leading-relaxed text-black-700">
        {{ project.description }}
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <article
        v-for="kpi in kpis"
        :key="kpi.label"
        class="rounded-2xl border border-black-200 bg-white p-5 shadow-sm"
      >
        <p class="text-xs font-700 uppercase tracking-[0.14em] text-black-500">
          {{ kpi.label }}
        </p>
        <p class="mt-2 text-h3 font-700 text-black-900">
          {{ kpi.value }}
        </p>
        <p class="mt-2 text-sm text-black-600">
          {{ kpi.detail }}
        </p>
      </article>
    </div>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <UiStatePanel
        data-testid="project-world-list"
        description="프로젝트에 포함된 월드의 상태와 마지막 변경 시각을 확인합니다."
        title="월드 현황"
      >
        <article
          v-for="world in projectWorlds"
          :key="world.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black-200 bg-black-50 px-4 py-4"
        >
          <div>
            <NuxtLink
              :to="`/projects/${project.id}/worlds/${world.id}`"
              class="text-sm font-700 text-black-900"
            >
              {{ world.name }}
            </NuxtLink>
            <p class="mt-1 text-xs text-black-600">
              {{ world.description }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-black-500">
              {{ DateTime.fromISO(world.updatedAt).toFormat('yyyy.MM.dd HH:mm') }}
            </span>
            <UiStatusBadge
              :label="world.status"
              :status="world.status"
            />
          </div>
        </article>
      </UiStatePanel>

      <UiStatePanel
        data-testid="project-quick-actions"
        description="모든 작업은 현재 UI 단계에서 해당 관리 화면으로만 이동합니다."
        title="빠른 관리 작업"
      >
        <div class="grid gap-2">
          <NuxtLink
            :to="`/projects/${project.id}/worlds/new`"
            class="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-700 text-white"
          >
            월드 생성
          </NuxtLink>
          <NuxtLink
            :to="`/projects/${project.id}/admins`"
            class="rounded-xl border border-black-200 bg-white px-4 py-3 text-center text-sm font-700 text-black-800"
          >
            관리자 배정 검토
          </NuxtLink>
          <NuxtLink
            :to="`/projects/${project.id}/settings`"
            class="rounded-xl border border-black-200 bg-white px-4 py-3 text-center text-sm font-700 text-black-800"
          >
            프로젝트 설정
          </NuxtLink>
        </div>
      </UiStatePanel>
    </div>

    <UiStatePanel
      description="프로젝트 범위에서 최근 변경된 문서를 fixture 기준으로 표시합니다."
      title="최근 문서"
    >
      <div class="grid gap-3 md:grid-cols-2">
        <article
          v-for="document in latestDocuments"
          :key="document.id"
          class="rounded-2xl border border-black-200 bg-black-50 px-4 py-3"
        >
          <p class="text-sm font-700 text-black-900">
            {{ document.title }}
          </p>
          <p class="mt-1 text-xs text-black-500">
            {{ DateTime.fromISO(document.updatedAt).toFormat('yyyy.MM.dd HH:mm') }} · {{ document.status }}
          </p>
        </article>
      </div>
    </UiStatePanel>
  </section>
  <UiStatePanel
    v-else
    description="fixture 기준으로 해당 프로젝트를 찾지 못했습니다."
    title="프로젝트를 찾을 수 없습니다"
  />
</template>
