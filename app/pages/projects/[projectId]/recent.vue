<script setup lang="ts">
definePageMeta({ layout: 'project-dashboard', });

useSetMeta({
  title: '프로젝트 최근 항목',
  url: '/projects/:projectId/recent',
});
</script>

<template>
  <ProjectManagementView section-description="프로젝트 범위의 최근 접근 문서를 fixture 기준으로 표시합니다." section-title="최근 문서" mode="derived" />
</template>
