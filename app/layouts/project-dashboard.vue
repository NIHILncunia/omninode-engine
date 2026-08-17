<script setup lang="ts">
import { computed, ref } from 'vue';
import { uiFixture } from '~/data/ui-fixture.data';

const isSidebarOpen = ref(false);
const isPanelOpen = ref(false);

const currentProject = computed(() => uiFixture.projects[0]);
const projectWorlds = computed(() => uiFixture.worlds.filter((world) => world.projectId === currentProject.value.id));
const projectLinks = computed(() => [
  {
    label: '프로젝트 개요',
    description: currentProject.value.description,
    to: '/projects',
    badge: currentProject.value.status,
  },
  ...projectWorlds.value.map((world) => ({
    label: world.name,
    description: world.description,
    to: `/projects/${currentProject.value.id}/worlds`,
    badge: world.status,
  })),
]);

const onOpenSidebar = (): void => {
  isSidebarOpen.value = true;
};

const onOpenPanel = (): void => {
  isPanelOpen.value = true;
};
</script>

<template>
  <ElContainer class="min-h-dvh bg-black-50 text-black-900">
    <AppHeader
      description="프로젝트 컨텍스트"
      panel-toggle-label="프로젝트 상태 패널 열기"
      :show-panel-toggle="true"
      :show-sidebar-toggle="true"
      sidebar-toggle-label="프로젝트 사이드바 열기"
      title="옴니노드 프로젝트 대시보드"
      @toggle-panel="onOpenPanel"
      @toggle-sidebar="onOpenSidebar"
    />
    <ElContainer class="min-h-0 flex-1">
      <ElAside class="hidden w-80 border-r border-black-200 lg:block">
        <DashboardSidebar
          :description="currentProject.description"
          :links="projectLinks"
          title="프로젝트 범위"
        />
      </ElAside>
      <ElMain class="flex min-h-0 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
        <UiPageHeader
          :description="`${currentProject.name} 안에서 월드 목록, 최근 문서, 프로젝트 관리자 작업을 공통 UI로 감쌉니다.`"
          title="프로젝트 대시보드 셸"
        />
        <section class="rounded-2xl border border-black-200 bg-white p-6 shadow-sm">
          <slot />
        </section>
      </ElMain>
      <ElAside class="hidden w-88 border-l border-black-200 bg-black-50 p-4 lg:block">
        <UiStatePanel
          :description="currentProject.description"
          title="프로젝트 상태 패널"
        >
          <template #badge>
            <UiStatusBadge
              :label="currentProject.status"
              :status="currentProject.status"
            />
          </template>
          <p>프로젝트: {{ currentProject.name }}</p>
          <p>월드 수: {{ projectWorlds.length }}</p>
          <p>문서 수: {{ uiFixture.documents.filter((document) => projectWorlds.some((world) => world.id === document.worldId)).length }}</p>
        </UiStatePanel>
      </ElAside>
    </ElContainer>

    <ElDrawer
      v-model="isSidebarOpen"
      direction="ltr"
      size="320"
      title="프로젝트 탐색"
    >
      <DashboardSidebar
        :description="currentProject.description"
        :links="projectLinks"
        title="프로젝트 범위"
      />
    </ElDrawer>

    <ElDrawer
      v-model="isPanelOpen"
      size="320"
      title="프로젝트 상태"
    >
      <UiStatePanel
        :description="currentProject.description"
        title="프로젝트 상태 패널"
      >
        <template #badge>
          <UiStatusBadge
            :label="currentProject.status"
            :status="currentProject.status"
          />
        </template>
        <p>프로젝트: {{ currentProject.name }}</p>
        <p>월드 수: {{ projectWorlds.length }}</p>
        <p>문서 수: {{ uiFixture.documents.filter((document) => projectWorlds.some((world) => world.id === document.worldId)).length }}</p>
      </UiStatePanel>
    </ElDrawer>
  </ElContainer>
</template>
