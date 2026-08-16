<script setup lang="ts">
useSetMeta({
  title: '홈',
  url: '/',
});

await navigateTo('/docs', { replace: true, });
</script>

<template>
  <span hidden />
</template>
