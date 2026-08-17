<script setup lang="ts">
definePageMeta({ layout: 'project-dashboard', });

useSetMeta({
  title: '프로젝트 템플릿',
  url: '/projects/:projectId/templates',
});
</script>

<template>
  <ProjectManagementView section-description="월드별 문서 템플릿을 프로젝트 범위에서 탐색합니다." section-title="프로젝트 템플릿" mode="derived" />
</template>
