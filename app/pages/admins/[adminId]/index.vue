<script setup lang="ts">
definePageMeta({ middleware: 'super-admin', });
const adminId = Number(useRoute().params.adminId);
useSetMeta({
  title: '관리자 상세',
  url: '/admins/:adminId',
});
</script>

<template>
  <AdminDetail :admin-id="adminId" />
</template>
