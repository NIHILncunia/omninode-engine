<script setup lang="ts">
definePageMeta({ layout: 'project-dashboard', });

useSetMeta({
  title: '프로젝트 휴지통',
  url: '/projects/:projectId/trash',
});
</script>

<template>
  <ProjectManagementView section-description="삭제·보관 상태의 항목을 프로젝트 범위에서 검토합니다." section-title="휴지통" mode="derived" />
</template>
