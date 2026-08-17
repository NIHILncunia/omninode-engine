<script setup lang="ts">
import { computed } from 'vue';
import { uiFixture } from '~/data/ui-fixture.data';

definePageMeta({ layout: 'default', });

useSetMeta({
  title: '설정 문서 상세',
  url: '/projects/:projectId/worlds/:worldId/documents/:documentId',
});

const route = useRoute();
const projectId = computed(() => Array.isArray(route.params.projectId) ? route.params.projectId[0] : route.params.projectId);
const worldId = computed(() => Array.isArray(route.params.worldId) ? route.params.worldId[0] : route.params.worldId);
const documentId = computed(() => Array.isArray(route.params.documentId) ? route.params.documentId[0] : route.params.documentId);
const project = computed(() => uiFixture.projects.find((item) => item.id === projectId.value) ?? uiFixture.projects[0]);
const world = computed(() => uiFixture.worlds.find((item) => item.id === worldId.value) ?? uiFixture.worlds.find((item) => item.projectId === project.value.id) ?? uiFixture.worlds[0]);
const document = computed(() => uiFixture.documents.find((item) => item.id === documentId.value && item.worldId === world.value.id) ?? uiFixture.documents.find((item) => item.worldId === world.value.id) ?? null);
const category = computed(() => uiFixture.categories.find((item) => item.id === document.value?.categoryId) ?? null);
const relatedRoutes = computed(() => {
  if (!document.value) {
    return [
    ];
  }

  return [
    {
      label: '월드 문서',
      to: `/projects/${project.value.id}/worlds/${world.value.id}/documents`,
    },
    {
      label: '카테고리 문서',
      to: category.value
        ? `/projects/${project.value.id}/worlds/${world.value.id}/categories/${category.value.id}/documents`
        : `/projects/${project.value.id}/worlds/${world.value.id}/documents`,
    },
    {
      label: '관계도',
      to: `/projects/${project.value.id}/worlds/${world.value.id}/documents/${document.value.id}/relations`,
    },
  ];
});
</script>
<template>
  <div class="grid gap-6 xl:grid-cols-[280px_minmax(0,2fr)_320px]">
    <DocumentSidebar
      :current-document-id="document?.id"
      :world-id="world.id"
    />

    <DocumentDetail
      :category="category"
      :document="document"
      :project="project"
      :world="world"
    />

    <DocumentMetaPanel
      :category="category"
      :document="document"
      :project="project"
      :related-routes="relatedRoutes"
      :world="world"
    />
  </div>
</template>
