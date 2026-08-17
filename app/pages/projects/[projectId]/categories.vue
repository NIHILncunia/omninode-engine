<script setup lang="ts">
definePageMeta({ layout: 'project-dashboard', });

useSetMeta({
  title: '프로젝트 카테고리',
  url: '/projects/:projectId/categories',
});
</script>

<template>
  <ProjectManagementView section-description="월드별 카테고리 구조를 관리하기 위한 프로젝트 범위 진입 화면입니다." section-title="프로젝트 카테고리" mode="derived" />
</template>
