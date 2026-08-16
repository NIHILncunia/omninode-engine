<script setup lang="ts">
definePageMeta({ middleware: 'super-admin', });
useSetMeta({
  title: '관리자 목록',
  url: '/admins',
});
</script>

<template>
  <AdminList />
</template>
