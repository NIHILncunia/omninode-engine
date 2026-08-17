<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { uiFixture } from '~/data/ui-fixture.data';

definePageMeta({ layout: 'default', });

useSetMeta({
  title: '카테고리 문서',
  url: '/projects/:projectId/worlds/:worldId/categories/:categoryId/documents',
});

const route = useRoute();
const projectId = computed(() => Array.isArray(route.params.projectId) ? route.params.projectId[0] : route.params.projectId);
const worldId = computed(() => Array.isArray(route.params.worldId) ? route.params.worldId[0] : route.params.worldId);
const categoryId = computed(() => Array.isArray(route.params.categoryId) ? route.params.categoryId[0] : route.params.categoryId);
const project = computed(() => uiFixture.projects.find((item) => item.id === projectId.value) ?? uiFixture.projects[0]);
const world = computed(() => uiFixture.worlds.find((item) => item.id === worldId.value) ?? uiFixture.worlds[0]);
const category = computed(() => uiFixture.categories.find((item) => item.id === categoryId.value) ?? uiFixture.categories.find((item) => item.worldId === world.value.id) ?? uiFixture.categories[0]);
const pageMode = computed<'ready' | 'loading' | 'empty' | 'error'>(() => {
  const value = Array.isArray(route.query.state) ? route.query.state[0] : route.query.state;

  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value;
  }

  return 'ready';
});
const documents = computed(() => uiFixture.documents.filter((document) => document.categoryId === category.value.id));
const selectedDocumentId = ref<string | undefined>(documents.value[0]?.id);

watch(
  documents,
  (nextDocuments) => {
    if (!nextDocuments.some((document) => document.id === selectedDocumentId.value)) {
      selectedDocumentId.value = nextDocuments[0]?.id;
    }
  },
  {
    immediate: true,
  },
);

const currentDocument = computed(() => documents.value.find((document) => document.id === selectedDocumentId.value) ?? documents.value[0] ?? null);
const relatedRoutes = computed(() => currentDocument.value
  ? [
    {
      label: '월드 문서',
      to: `/projects/${project.value.id}/worlds/${world.value.id}/documents`,
    },
    {
      label: '문서 상세',
      to: `/projects/${project.value.id}/worlds/${world.value.id}/documents/${currentDocument.value.id}`,
    },
  ]
  : [
  ]);
const onSelectDocument = (documentId: string | undefined): void => {
  selectedDocumentId.value = documentId;
};
const getDocumentTo = (document: typeof uiFixture.documents[number]): string => `/projects/${project.value.id}/worlds/${world.value.id}/documents/${document.id}`;
</script>
<template>
  <div class="grid gap-6 xl:grid-cols-[280px_minmax(0,2fr)_320px]">
    <DocumentSidebar :world-id="world.id" />

    <DocumentList
      :categories="uiFixture.categories.filter((item) => item.worldId === world.id)"
      :documents="documents"
      :get-document-to="getDocumentTo"
      :mode="pageMode"
      :selected-document-id="selectedDocumentId"
      :title="`${category.name} 문서`"
      description="특정 카테고리에 속한 fixture 문서를 선택하고 상세 페이지 경로로 이어집니다."
      @update:selected-document-id="onSelectDocument"
    />

    <DocumentMetaPanel
      :category="category"
      :document="currentDocument"
      :mode="pageMode"
      :project="project"
      :related-routes="relatedRoutes"
      :world="world"
    />
  </div>
</template>
