<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { uiFixture } from '~/data/ui-fixture.data';

definePageMeta({ layout: 'default', });

useSetMeta({
  title: '프로젝트 문서',
  url: '/projects/:projectId/documents',
});

const route = useRoute();
const projectId = computed(() => Array.isArray(route.params.projectId) ? route.params.projectId[0] : route.params.projectId);
const project = computed(() => uiFixture.projects.find((item) => item.id === projectId.value) ?? uiFixture.projects[0]);
const pageMode = computed<'ready' | 'loading' | 'empty' | 'error'>(() => {
  const value = Array.isArray(route.query.state) ? route.query.state[0] : route.query.state;

  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value;
  }

  return 'ready';
});
const documents = computed(() => uiFixture.documents.filter((document) => project.value.worldIds.includes(document.worldId)));
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
const currentWorld = computed(() => uiFixture.worlds.find((world) => world.id === currentDocument.value?.worldId) ?? uiFixture.worlds.find((world) => world.id === project.value.worldIds[0]) ?? null);
const currentCategory = computed(() => uiFixture.categories.find((category) => category.id === currentDocument.value?.categoryId) ?? null);
const relatedRoutes = computed(() => {
  if (!currentDocument.value || !currentWorld.value) {
    return [
    ];
  }

  return [
    {
      label: '월드 문서',
      to: `/projects/${project.value.id}/worlds/${currentWorld.value.id}/documents`,
    },
    {
      label: '문서 상세',
      to: `/projects/${project.value.id}/worlds/${currentWorld.value.id}/documents/${currentDocument.value.id}`,
    },
  ];
});
const onSelectDocument = (documentId: string | undefined): void => {
  selectedDocumentId.value = documentId;
};
const getDocumentTo = (document: typeof uiFixture.documents[number]): string => `/projects/${project.value.id}/worlds/${document.worldId}/documents/${document.id}`;
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[280px_minmax(0,2fr)_320px]">
    <DocumentSidebar :world-id="currentWorld?.id" />

    <DocumentList
      :categories="uiFixture.categories.filter((category) => project.worldIds.includes(category.worldId))"
      :documents="documents"
      :get-document-to="getDocumentTo"
      :mode="pageMode"
      :selected-document-id="selectedDocumentId"
      :title="`${project.name} 문서`"
      description="프로젝트에 포함된 모든 월드의 문서를 하나의 fixture 목록으로 묶어 탐색합니다."
      @update:selected-document-id="onSelectDocument"
    />

    <DocumentMetaPanel
      :category="currentCategory"
      :document="currentDocument"
      :mode="pageMode"
      :project="project"
      :related-routes="relatedRoutes"
      :world="currentWorld"
    />
  </div>
</template>
