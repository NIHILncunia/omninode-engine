<script setup lang="ts">
definePageMeta({ layout: false, });

useSetMeta({
  title: '홈',
  url: '/',
});

await navigateTo('/docs', { replace: true, });
</script>

<template>
  <span hidden />
</template>
