<script setup lang="ts">
definePageMeta({ layout: 'project-dashboard', });

useSetMeta({
  title: '프로젝트 대시보드',
  url: '/projects/:projectId',
});
</script>

<template>
  <ProjectDashboard />
</template>
