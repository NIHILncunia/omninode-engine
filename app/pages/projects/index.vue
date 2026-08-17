<script setup lang="ts">
definePageMeta({ layout: 'project-dashboard', });

useSetMeta({
  title: '프로젝트 목록',
  url: '/projects',
});
</script>

<template>
  <ProjectManagementView mode="list" />
</template>
