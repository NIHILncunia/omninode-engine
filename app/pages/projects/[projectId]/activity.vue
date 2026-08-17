<script setup lang="ts">
definePageMeta({ layout: 'project-dashboard', });

useSetMeta({
  title: '프로젝트 활동',
  url: '/projects/:projectId/activity',
});
</script>

<template>
  <ProjectManagementView section-description="프로젝트 안의 최근 변경 흐름을 fixture 기준으로 검토합니다." section-title="프로젝트 활동" mode="derived" />
</template>
