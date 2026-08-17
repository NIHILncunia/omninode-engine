<script setup lang="ts">
import { computed, ref } from 'vue';
import { uiFixture } from '~/data/ui-fixture.data';

const isSidebarOpen = ref(false);
const isPanelOpen = ref(false);

const currentWorld = computed(() => uiFixture.worlds[0]);
const worldCategories = computed(() => uiFixture.categories.filter((category) => category.worldId === currentWorld.value.id));
const worldDocuments = computed(() => uiFixture.documents.filter((document) => document.worldId === currentWorld.value.id));
const worldLinks = computed(() => [
  {
    label: '카테고리',
    description: '계층 구조와 정렬 상태',
    to: `/projects/${currentWorld.value.projectId}/worlds/${currentWorld.value.id}/categories`,
    badge: String(worldCategories.value.length),
  },
  {
    label: '문서',
    description: '목록과 상세, 공개 상태',
    to: `/projects/${currentWorld.value.projectId}/worlds/${currentWorld.value.id}/documents`,
    badge: String(worldDocuments.value.length),
  },
  {
    label: '관계 타입',
    description: '문서 관계와 표현용 설정',
    to: `/projects/${currentWorld.value.projectId}/worlds/${currentWorld.value.id}/relation-types`,
    badge: '예정',
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
  <ElContainer direction="vertical" class="min-h-dvh bg-black-50 text-black-900">
    <AppHeader
      description="월드 컨텍스트"
      panel-toggle-label="월드 상태 패널 열기"
      :show-panel-toggle="true"
      :show-sidebar-toggle="true"
      sidebar-toggle-label="월드 사이드바 열기"
      title="옴니노드 월드 대시보드"
      @toggle-panel="onOpenPanel"
      @toggle-sidebar="onOpenSidebar"
    />
    <ElContainer class="min-h-0 flex-1">
      <ElAside class="hidden w-80 border-r border-black-200 lg:block">
        <DashboardSidebar
          :description="currentWorld.description"
          :links="worldLinks"
          title="월드 범위"
        />
      </ElAside>
      <ElMain class="flex min-h-0 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
        <UiPageHeader
          :description="`${currentWorld.name} 안에서 카테고리·문서·관계 화면이 같은 셸을 재사용합니다.`"
          title="월드 대시보드 셸"
        />
        <section class="rounded-2xl border border-black-200 bg-white p-6 shadow-sm">
          <slot />
        </section>
      </ElMain>
      <ElAside class="hidden w-88 border-l border-black-200 bg-black-50 p-4 lg:block">
        <UiStatePanel
          :description="currentWorld.description"
          title="월드 상태 패널"
        >
          <template #badge>
            <UiStatusBadge
              :label="currentWorld.status"
              :status="currentWorld.status"
            />
          </template>
          <p>월드: {{ currentWorld.name }}</p>
          <p>카테고리 수: {{ worldCategories.length }}</p>
          <p>문서 수: {{ worldDocuments.length }}</p>
        </UiStatePanel>
      </ElAside>
    </ElContainer>

    <ElDrawer
      v-model="isSidebarOpen"
      direction="ltr"
      size="320"
      title="월드 탐색"
    >
      <DashboardSidebar
        :description="currentWorld.description"
        :links="worldLinks"
        title="월드 범위"
      />
    </ElDrawer>

    <ElDrawer
      v-model="isPanelOpen"
      size="320"
      title="월드 상태"
    >
      <UiStatePanel
        :description="currentWorld.description"
        title="월드 상태 패널"
      >
        <template #badge>
          <UiStatusBadge
            :label="currentWorld.status"
            :status="currentWorld.status"
          />
        </template>
        <p>월드: {{ currentWorld.name }}</p>
        <p>카테고리 수: {{ worldCategories.length }}</p>
        <p>문서 수: {{ worldDocuments.length }}</p>
      </UiStatePanel>
    </ElDrawer>
  </ElContainer>
</template>
