<script setup lang="ts">
import { computed } from 'vue';
import DocumentDetail from '~/components/docs/DocumentDetail.vue';
import DocumentMetaPanel from '~/components/docs/DocumentMetaPanel.vue';
import { buildDocumentDetailContext, resolveDocumentViewMode } from '~/components/docs/document-route.shared';

const route = useRoute();
const pageMode = computed(() => resolveDocumentViewMode(route.query));
const detailContext = computed(() => buildDocumentDetailContext(route));
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[280px_minmax(0,2fr)_320px]">
    <DocumentSidebar
      :current-document-id="detailContext.document?.id"
      :world-id="detailContext.world.id"
    />

    <DocumentDetail
      :category="detailContext.category"
      :document="detailContext.document"
      :mode="pageMode"
      :project="detailContext.project"
      :world="detailContext.world"
    />

    <DocumentMetaPanel
      :category="detailContext.category"
      :document="detailContext.document"
      :mode="pageMode"
      :project="detailContext.project"
      :related-routes="detailContext.relatedRoutes"
      :world="detailContext.world"
    />
  </div>
</template>
