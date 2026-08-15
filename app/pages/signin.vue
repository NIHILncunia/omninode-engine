<script setup lang="ts">
definePageMeta({
  layout: 'auth',
});

useSetMeta({
  title: '로그인',
  url: '/signin',
});
</script>

<template>
  <SigninForm />
</template>
