<script setup lang="ts">
definePageMeta({ layout: 'default', });

useSetMeta({
  title: '프로젝트 문서',
  url: '/projects/:projectId/documents',
});
</script>

<template>
  <DocumentExplorerRouteView scope="project" />
</template>
