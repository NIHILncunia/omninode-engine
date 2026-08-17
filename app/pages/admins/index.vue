<script setup lang="ts">
definePageMeta({
  layout: 'super-admin-dashboard',
  middleware: 'super-admin',
});
useSetMeta({
  title: '관리자 목록',
  url: '/admins',
});
</script>

<template>
  <AdminManagementView />
</template>
