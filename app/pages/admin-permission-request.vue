<script setup lang="ts">
definePageMeta({ layout: 'auth', });
useSetMeta({
  title: '관리자 권한 요청',
  url: '/admin-permission-request',
});
</script>

<template>
  <AdminPermissionRequestForm />
</template>
