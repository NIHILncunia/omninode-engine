<script setup lang="ts">
definePageMeta({ layout: 'project-dashboard', });

useSetMeta({
  title: '프로젝트 관계',
  url: '/projects/:projectId/relations',
});
</script>

<template>
  <ProjectManagementView section-description="월드 간 문서 관계를 프로젝트 범위에서 탐색하는 화면입니다." section-title="문서 관계" mode="derived" />
</template>
