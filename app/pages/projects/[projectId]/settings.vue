<script setup lang="ts">
definePageMeta({ layout: 'project-dashboard', });

useSetMeta({
  title: '프로젝트 설정',
  url: '/projects/:projectId/settings',
});
</script>

<template>
  <ProjectManagementView mode="settings" />
</template>
