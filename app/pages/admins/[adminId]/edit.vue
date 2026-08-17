<script setup lang="ts">
definePageMeta({
  layout: 'super-admin-dashboard',
  middleware: 'super-admin',
});
useSetMeta({
  title: '관리자 수정',
  url: '/admins/:adminId/edit',
});
</script>

<template>
  <AdminManagementView mode="edit" />
</template>
