<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { ref } from 'vue';
import { cn } from '~/utils/cn';

const props = defineProps<{ projectId: number; class?: string }>();
const revision = ref(0);
const cssVariants = cva(['flex', 'flex-col', 'gap-5'], { variants: {}, compoundVariants: [], defaultVariants: {}, });

const onRefreshProjectAdmin = (): void => {
  revision.value += 1;
};
</script>

<template>
  <section :class="cn([cssVariants({}), props.class])">
    <header><h1 class="text-h3 font-700">프로젝트 관리자</h1><p class="text-sm text-black-600">프로젝트에 참여할 서브 어드민을 관리합니다.</p></header>
    <ProjectAdminInviteForm :project-id="props.projectId" @invited="onRefreshProjectAdmin" />
    <ProjectAdminList :project-id="props.projectId" :revision="revision" />
  </section>
</template>
