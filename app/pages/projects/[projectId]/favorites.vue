<script setup lang="ts">
definePageMeta({ layout: 'project-dashboard', });

useSetMeta({
  title: '프로젝트 즐겨찾기',
  url: '/projects/:projectId/favorites',
});
</script>

<template>
  <ProjectManagementView section-description="프로젝트 범위에서 빠르게 다시 열 문서를 모아 확인합니다." section-title="즐겨찾기" mode="derived" />
</template>
