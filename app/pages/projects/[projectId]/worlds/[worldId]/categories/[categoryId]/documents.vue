<script setup lang="ts">
definePageMeta({ layout: 'default', });

useSetMeta({
  title: '카테고리 문서',
  url: '/projects/:projectId/worlds/:worldId/categories/:categoryId/documents',
});
</script>
<template>
  <DocumentExplorerRouteView scope="category" />
</template>
