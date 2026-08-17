<script setup lang="ts">
definePageMeta({
  layout: 'super-admin-dashboard',
  middleware: 'super-admin',
});

useSetMeta({
  title: '슈퍼 어드민 대시보드',
  url: '/admin',
});
</script>

<template>
  <SuperAdminDashboard />
</template>
