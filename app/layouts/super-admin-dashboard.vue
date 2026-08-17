<script setup lang="ts">
import { computed, ref } from 'vue';
import { uiFixture } from '~/data/ui-fixture.data';

const isSidebarOpen = ref(false);
const isPanelOpen = ref(false);

const adminLinks = computed(() => [
  {
    label: '관리자 목록',
    description: '전역 관리자와 역할 상태',
    to: '/admins',
    badge: String(uiFixture.admins.length),
  },
  {
    label: '권한 요청',
    description: '승인 대기 상태와 최근 요청',
    to: '/admin-permission-request',
    badge: '2',
  },
  {
    label: '프로젝트 현황',
    description: '프로젝트 수와 활성 상태',
    to: '/projects',
    badge: String(uiFixture.projects.length),
  },
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
      description="슈퍼 어드민 컨텍스트"
      panel-toggle-label="전역 상태 패널 열기"
      :show-panel-toggle="true"
      :show-sidebar-toggle="true"
      sidebar-toggle-label="슈퍼 어드민 사이드바 열기"
      title="옴니노드 슈퍼 어드민"
      @toggle-panel="onOpenPanel"
      @toggle-sidebar="onOpenSidebar"
    />
    <ElContainer class="min-h-0 flex-1">
      <ElAside class="hidden w-80 border-r border-black-200 lg:block">
        <DashboardSidebar
          description="전역 관리자·권한·프로젝트 지표를 하나의 셸로 묶습니다."
          :links="adminLinks"
          title="슈퍼 어드민"
        />
      </ElAside>
      <ElMain class="flex min-h-0 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
        <UiPageHeader
          description="전역 KPI, 관리자 목록, 권한 요청 화면이 공통 헤더와 대시보드 탐색을 공유합니다."
          title="슈퍼 어드민 대시보드 셸"
        />
        <section class="rounded-2xl border border-black-200 bg-white p-6 shadow-sm">
          <slot />
        </section>
      </ElMain>
      <ElAside class="hidden w-88 border-l border-black-200 bg-black-50 p-4 lg:block">
        <UiStatePanel
          description="fixture 기준 전역 상태 요약입니다."
          title="전역 상태 패널"
        >
          <template #badge>
            <UiStatusBadge
              label="ACTIVE"
              status="ACTIVE"
            />
          </template>
          <p>관리자 수: {{ uiFixture.admins.length }}</p>
          <p>활성 프로젝트: {{ uiFixture.projects.filter((project) => project.status === 'ACTIVE').length }}</p>
          <p>보관 프로젝트: {{ uiFixture.projects.filter((project) => project.status === 'ARCHIVED').length }}</p>
        </UiStatePanel>
      </ElAside>
    </ElContainer>

    <ElDrawer
      v-model="isSidebarOpen"
      direction="ltr"
      size="320"
      title="슈퍼 어드민 탐색"
    >
      <DashboardSidebar
        description="전역 관리자·권한·프로젝트 지표를 하나의 셸로 묶습니다."
        :links="adminLinks"
        title="슈퍼 어드민"
      />
    </ElDrawer>

    <ElDrawer
      v-model="isPanelOpen"
      size="320"
      title="전역 상태"
    >
      <UiStatePanel
        description="fixture 기준 전역 상태 요약입니다."
        title="전역 상태 패널"
      >
        <template #badge>
          <UiStatusBadge
            label="ACTIVE"
            status="ACTIVE"
          />
        </template>
        <p>관리자 수: {{ uiFixture.admins.length }}</p>
        <p>활성 프로젝트: {{ uiFixture.projects.filter((project) => project.status === 'ACTIVE').length }}</p>
        <p>보관 프로젝트: {{ uiFixture.projects.filter((project) => project.status === 'ARCHIVED').length }}</p>
      </UiStatePanel>
    </ElDrawer>
  </ElContainer>
</template>
