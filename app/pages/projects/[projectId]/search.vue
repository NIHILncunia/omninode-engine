<script setup lang="ts">
definePageMeta({ layout: 'project-dashboard', });

useSetMeta({
  title: '프로젝트 검색',
  url: '/projects/:projectId/search',
});
</script>

<template>
  <ProjectManagementView section-description="프로젝트에 속한 월드와 문서를 탐색할 수 있는 작업 화면입니다." section-title="프로젝트 검색" mode="derived" />
</template>
