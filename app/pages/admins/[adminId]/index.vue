<script setup lang="ts">
definePageMeta({
  layout: 'super-admin-dashboard',
  middleware: 'super-admin',
});
useSetMeta({
  title: '관리자 상세',
  url: '/admins/:adminId',
});
</script>

<template>
  <AdminManagementView mode="detail" />
</template>
