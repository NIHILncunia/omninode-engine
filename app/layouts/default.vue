<script setup lang="ts">
import { ref } from 'vue';

const isSidebarOpen = ref(false);

const onOpenSidebar = (): void => {
  isSidebarOpen.value = true;
};
</script>

<template>
  <ElContainer direction="vertical" class="min-h-dvh bg-black-50 text-black-900">
    <AppHeader
      description="공개 문서와 기본 탐색 컨텍스트"
      :show-sidebar-toggle="true"
      sidebar-toggle-label="기본 탐색 사이드바 열기"
      title="옴니노드"
      @toggle-sidebar="onOpenSidebar"
    />
    <ElContainer class="min-h-0 flex-1">
      <ElAside class="hidden w-72 border-r border-black-200 bg-white lg:block">
        <AppSidebar class="p-5" />
      </ElAside>
      <ElMain class="min-h-0 overflow-y-auto p-4 lg:p-6">
        <slot />
      </ElMain>
    </ElContainer>

    <ElDrawer
      v-model="isSidebarOpen"
      direction="ltr"
      size="320"
      title="기본 탐색"
    >
      <AppSidebar class="p-2" />
    </ElDrawer>
  </ElContainer>
</template>
