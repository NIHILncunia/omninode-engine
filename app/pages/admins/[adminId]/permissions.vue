<script setup lang="ts">
definePageMeta({ middleware: 'super-admin', });
const adminId = Number(useRoute().params.adminId);
useSetMeta({
  title: '관리자 권한 설정',
  url: '/admins/:adminId/permissions',
});
</script>

<template>
  <AdminPermissionForm :admin-id="adminId" />
</template>
