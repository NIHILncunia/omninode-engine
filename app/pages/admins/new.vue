<script setup lang="ts">
definePageMeta({ middleware: 'super-admin', });
useSetMeta({
  title: '관리자 생성',
  url: '/admins/new',
});
</script>

<template>
  <AdminCreateForm />
</template>
