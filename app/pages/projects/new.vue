<script setup lang="ts">
definePageMeta({ layout: 'project-dashboard', });

useSetMeta({
  title: '새 프로젝트',
  url: '/projects/new',
});
</script>

<template>
  <ProjectManagementView mode="create" />
</template>
