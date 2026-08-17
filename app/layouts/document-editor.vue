<script setup lang="ts">
import { computed, ref } from 'vue';
import { uiFixture } from '~/data/ui-fixture.data';

const isSidebarOpen = ref(false);
const isPanelOpen = ref(false);

const currentDocument = computed(() => uiFixture.documents[0]);
const currentWorld = computed(() => uiFixture.worlds.find((world) => world.id === currentDocument.value?.worldId) ?? uiFixture.worlds[0]);

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
      description="문서 편집 컨텍스트"
      panel-toggle-label="문서 메타 패널 열기"
      :show-panel-toggle="true"
      :show-sidebar-toggle="true"
      sidebar-toggle-label="문서 사이드바 열기"
      title="옴니노드 문서 편집"
      @toggle-panel="onOpenPanel"
      @toggle-sidebar="onOpenSidebar"
    />
    <ElContainer class="min-h-0 flex-1">
      <ElAside class="hidden w-80 border-r border-black-200 lg:block">
        <DocumentSidebar :current-document-id="currentDocument?.id" />
      </ElAside>
      <ElMain class="flex min-h-0 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
        <UiPageHeader
          description="문서 목록·편집 본문·메타 상태를 한 레이아웃에서 재사용하기 위한 UI 기반입니다."
          title="설정 문서 편집 셸"
        >
          <template #actions>
            <UiStatusBadge
              :label="currentDocument?.status"
              :status="currentDocument?.status ?? 'DRAFT'"
            />
          </template>
        </UiPageHeader>
        <section class="rounded-2xl border border-black-200 bg-white p-6 shadow-sm">
          <slot />
        </section>
      </ElMain>
      <ElAside class="hidden w-88 border-l border-black-200 bg-black-50 p-4 lg:block">
        <UiStatePanel
          :description="currentWorld.description"
          title="문서 메타 패널"
        >
          <template #badge>
            <UiStatusBadge
              :label="currentDocument?.status"
              :status="currentDocument?.status ?? 'DRAFT'"
            />
          </template>
          <p>문서: {{ currentDocument?.title }}</p>
          <p>월드: {{ currentWorld.name }}</p>
          <p>업데이트: {{ currentDocument?.updatedAt }}</p>
        </UiStatePanel>
      </ElAside>
    </ElContainer>

    <ElDrawer
      v-model="isSidebarOpen"
      direction="ltr"
      size="320"
      title="문서 탐색"
    >
      <DocumentSidebar :current-document-id="currentDocument?.id" />
    </ElDrawer>

    <ElDrawer
      v-model="isPanelOpen"
      size="320"
      title="문서 상태"
    >
      <UiStatePanel
        :description="currentWorld.description"
        title="문서 메타 패널"
      >
        <template #badge>
          <UiStatusBadge
            :label="currentDocument?.status"
            :status="currentDocument?.status ?? 'DRAFT'"
          />
        </template>
        <p>문서: {{ currentDocument?.title }}</p>
        <p>월드: {{ currentWorld.name }}</p>
        <p>업데이트: {{ currentDocument?.updatedAt }}</p>
      </UiStatePanel>
    </ElDrawer>
  </ElContainer>
</template>
