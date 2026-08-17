<script setup lang="ts">
definePageMeta({ layout: 'default', });

useSetMeta({
  title: '설정 문서 상세',
  url: '/projects/:projectId/worlds/:worldId/documents/:documentId',
});
</script>
<template>
  <DocumentDetailRouteView />
</template>
