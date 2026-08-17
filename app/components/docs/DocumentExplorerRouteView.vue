<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { uiFixture } from '~/data/ui-fixture.data';
import DocumentList from '~/components/docs/DocumentList.vue';
import DocumentMetaPanel from '~/components/docs/DocumentMetaPanel.vue';
import { buildDocumentExplorerContext, buildDocumentExplorerRelatedRoutes, resolveDocumentViewMode, type DocumentExplorerScope } from '~/components/docs/document-route.shared';

const props = defineProps<{
  scope: DocumentExplorerScope;
}>();

const route = useRoute();
const context = computed(() => buildDocumentExplorerContext(props.scope, route));
const selectedDocumentId = ref<string | undefined>(context.value.documents[0]?.id);

watch(
  () => context.value.documents,
  (documents) => {
    if (!documents.some((document) => document.id === selectedDocumentId.value)) {
      selectedDocumentId.value = documents[0]?.id;
    }
  },
  {
    immediate: true,
  },
);

const pageMode = computed(() => resolveDocumentViewMode(route.query));
const currentDocument = computed(() => context.value.documents.find((document) => document.id === selectedDocumentId.value) ?? context.value.documents[0] ?? null);
const currentWorld = computed(() => uiFixture.worlds.find((world) => world.id === currentDocument.value?.worldId) ?? uiFixture.worlds.find((world) => world.id === context.value.defaultSidebarWorldId) ?? null);
const currentProject = computed(() => currentWorld.value
  ? uiFixture.projects.find((project) => project.id === currentWorld.value?.projectId) ?? null
  : null);
const currentCategory = computed(() => uiFixture.categories.find((category) => category.id === currentDocument.value?.categoryId) ?? null);
const sidebarWorldId = computed(() => currentWorld.value?.id ?? context.value.defaultSidebarWorldId);
const relatedRoutes = computed(() => buildDocumentExplorerRelatedRoutes(
  props.scope,
  currentDocument.value,
  currentProject.value,
  currentWorld.value,
  currentCategory.value,
));

const onSelectDocument = (documentId: string | undefined): void => {
  selectedDocumentId.value = documentId;
};
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[280px_minmax(0,2fr)_320px]">
    <DocumentSidebar :world-id="sidebarWorldId" />

    <DocumentList
      :categories="context.categories"
      :documents="context.documents"
      :get-document-to="context.getDocumentTo"
      :mode="pageMode"
      :selected-document-id="selectedDocumentId"
      :description="context.description"
      :title="context.title"
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
