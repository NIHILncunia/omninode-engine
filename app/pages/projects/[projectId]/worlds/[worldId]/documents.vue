<script setup lang="ts">
definePageMeta({ layout: 'default', });

useSetMeta({
  title: '월드 문서',
  url: '/projects/:projectId/worlds/:worldId/documents',
});
</script>
<template>
  <DocumentExplorerRouteView scope="world" />
</template>
