<script setup lang="ts">
definePageMeta({ middleware: 'project-admin', });
const projectId = Number(useRoute().params.projectId);
useSetMeta({
  title: '프로젝트 관리자',
  url: '/projects/:projectId/admins',
});
</script>

<template>
  <ProjectAdminManagement :project-id="projectId" />
</template>
