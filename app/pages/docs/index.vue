<script setup lang="ts">
import { computed, ref } from 'vue';
import { uiFixture } from '~/data/ui-fixture.data';

definePageMeta({ layout: 'default', });

useSetMeta({
  title: '공개 설정 문서',
  url: '/docs',
});

const route = useRoute();
const selectedDocumentId = ref<string | undefined>(uiFixture.documents.find((document) => document.status === 'PUBLIC')?.id);
const pageMode = computed<'ready' | 'loading' | 'empty' | 'error'>(() => {
  const value = Array.isArray(route.query.state) ? route.query.state[0] : route.query.state;

  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value;
  }

  return 'ready';
});

const documents = computed(() => uiFixture.documents.filter((document) => document.status === 'PUBLIC'));
const currentDocument = computed(() => documents.value.find((document) => document.id === selectedDocumentId.value) ?? documents.value[0] ?? null);
const currentWorld = computed(() => uiFixture.worlds.find((world) => world.id === currentDocument.value?.worldId) ?? null);
const currentProject = computed(() => currentWorld.value
  ? uiFixture.projects.find((project) => project.id === currentWorld.value?.projectId) ?? null
  : null);
const currentCategory = computed(() => uiFixture.categories.find((category) => category.id === currentDocument.value?.categoryId) ?? null);
const relatedRoutes = computed(() => {
  if (!currentDocument.value || !currentWorld.value || !currentProject.value) {
    return [
    ];
  }

  return [
    {
      label: '문서 상세',
      to: `/projects/${currentProject.value.id}/worlds/${currentWorld.value.id}/documents/${currentDocument.value.id}`,
    },
    {
      label: '월드 문서',
      to: `/projects/${currentProject.value.id}/worlds/${currentWorld.value.id}/documents`,
    },
  ];
});
const sidebarWorldId = computed(() => currentWorld.value?.id ?? uiFixture.worlds[0]?.id ?? 'world-luxtera');
const onSelectDocument = (documentId: string | undefined): void => {
  selectedDocumentId.value = documentId;
};
const getDocumentTo = (document: typeof uiFixture.documents[number]): string => {
  const world = uiFixture.worlds.find((item) => item.id === document.worldId);
  const project = uiFixture.projects.find((item) => item.id === world?.projectId);

  return `/projects/${project?.id ?? uiFixture.projects[0]?.id}/worlds/${document.worldId}/documents/${document.id}`;
};
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[280px_minmax(0,2fr)_320px]">
    <DocumentSidebar :world-id="sidebarWorldId" />

    <DocumentList
      :categories="uiFixture.categories.filter((category) => category.worldId === sidebarWorldId)"
      :documents="documents"
      :get-document-to="getDocumentTo"
      :mode="pageMode"
      :selected-document-id="selectedDocumentId"
      description="공개 상태의 fixture 문서를 프로젝트·월드 상세로 이어지는 경로와 함께 미리 확인합니다."
      title="공개 설정 문서"
      @update:selected-document-id="onSelectDocument"
    />

    <DocumentMetaPanel
      :category="currentCategory"
      :document="currentDocument"
      :mode="pageMode"
      :project="currentProject"
      :related-routes="relatedRoutes"
      :world="currentWorld"
    />
  </div>
</template>
