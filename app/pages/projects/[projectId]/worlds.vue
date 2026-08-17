<script setup lang="ts">
definePageMeta({ layout: 'project-dashboard', });

useSetMeta({
  title: '프로젝트 월드 목록',
  url: '/projects/:projectId/worlds',
});
</script>

<template>
  <ProjectManagementView mode="worlds" />
</template>
