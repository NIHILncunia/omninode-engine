<script setup lang="ts">
definePageMeta({
  layout: 'auth',
});

useSetMeta({
  title: '비밀번호 변경',
  url: '/account/password-change',
});
</script>

<template>
  <AuthPasswordChangeForm />
</template>
