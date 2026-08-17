<script setup lang="ts">
definePageMeta({ layout: 'project-dashboard', });

useSetMeta({
  title: '프로젝트 연표',
  url: '/projects/:projectId/timeline',
});
</script>

<template>
  <ProjectManagementView section-description="프로젝트 범위의 시간 정보와 문서 변경을 탐색합니다." section-title="프로젝트 타임라인" mode="derived" />
</template>
