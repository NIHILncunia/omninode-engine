<script setup lang="ts">
definePageMeta({ layout: 'default', });

useSetMeta({
  title: '공개 설정 문서',
  url: '/docs',
});
</script>

<template>
  <DocumentExplorerRouteView scope="public" />
</template>
