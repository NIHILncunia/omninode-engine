<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { uiFixture } from '~/data/ui-fixture.data';

definePageMeta({ layout: 'default', });

useSetMeta({
  title: '월드 문서',
  url: '/projects/:projectId/worlds/:worldId/documents',
});

const route = useRoute();
const projectId = computed(() => Array.isArray(route.params.projectId) ? route.params.projectId[0] : route.params.projectId);
const worldId = computed(() => Array.isArray(route.params.worldId) ? route.params.worldId[0] : route.params.worldId);
const project = computed(() => uiFixture.projects.find((item) => item.id === projectId.value) ?? uiFixture.projects[0]);
const world = computed(() => uiFixture.worlds.find((item) => item.id === worldId.value) ?? uiFixture.worlds.find((item) => item.projectId === project.value.id) ?? uiFixture.worlds[0]);
const pageMode = computed<'ready' | 'loading' | 'empty' | 'error'>(() => {
  const value = Array.isArray(route.query.state) ? route.query.state[0] : route.query.state;

  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value;
  }

  return 'ready';
});
const documents = computed(() => uiFixture.documents.filter((document) => document.worldId === world.value.id));
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
const currentCategory = computed(() => uiFixture.categories.find((category) => category.id === currentDocument.value?.categoryId) ?? null);
const relatedRoutes = computed(() => currentDocument.value
  ? [
    {
      label: '문서 상세',
      to: `/projects/${project.value.id}/worlds/${world.value.id}/documents/${currentDocument.value.id}`,
    },
    {
      label: '카테고리 문서',
      to: currentCategory.value
        ? `/projects/${project.value.id}/worlds/${world.value.id}/categories/${currentCategory.value.id}/documents`
        : `/projects/${project.value.id}/worlds/${world.value.id}/documents`,
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
      :categories="uiFixture.categories.filter((category) => category.worldId === world.id)"
      :documents="documents"
      :get-document-to="getDocumentTo"
      :mode="pageMode"
      :selected-document-id="selectedDocumentId"
      :title="`${world.name} 문서`"
      description="현재 월드에 속한 문서를 카테고리·상태 조건으로 걸러서 확인합니다."
      @update:selected-document-id="onSelectDocument"
    />

    <DocumentMetaPanel
      :category="currentCategory"
      :document="currentDocument"
      :mode="pageMode"
      :project="project"
      :related-routes="relatedRoutes"
      :world="world"
    />
  </div>
</template>
