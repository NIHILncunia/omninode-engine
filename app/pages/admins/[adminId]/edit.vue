<script setup lang="ts">
definePageMeta({ middleware: 'super-admin', });
const adminId = Number(useRoute().params.adminId);
useSetMeta({
  title: '관리자 수정',
  url: '/admins/:adminId/edit',
});
</script>

<template>
  <AdminEditForm :admin-id="adminId" />
</template>
