<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { reactive, ref } from 'vue';
import type { ProjectAdministratorResponse } from '~/types/administrator.types';
import { cn } from '~/utils/cn';

const props = defineProps<{ projectId: number; class?: string }>();
const emit = defineEmits<{ invited: [] }>();
const form = reactive({ email: '', name: '', });
const pending = ref(false);
const errorMessage = ref<string | null>(null);
const cssVariants = cva(['flex', 'flex-col', 'gap-3', 'rounded-md', 'border', 'border-black-300', 'bg-white', 'p-4'], { variants: {}, compoundVariants: [], defaultVariants: {}, });

const onInviteProjectAdmin = async (): Promise<void> => {
  pending.value = true;
  errorMessage.value = null;
  try {
    await $fetch<ProjectAdministratorResponse>(`/api/projects/${props.projectId}/admins`, {
      method: 'POST',
      credentials: 'include',
      body: { email: form.email, name: form.name || undefined, },
    });
    form.email = '';
    form.name = '';
    emit('invited');
  } catch {
    errorMessage.value = '서브 어드민을 초대하지 못했습니다. 계정 역할과 이메일을 확인해 주세요.';
  } finally {
    pending.value = false;
  }
};
</script>

<template>
  <ElForm :class="cn([cssVariants({}), props.class])" label-position="top" @submit.prevent="onInviteProjectAdmin">
    <header><h2 class="text-lg font-700">서브 어드민 초대·재초대</h2><p class="text-sm text-black-600">기존 계정은 재초대하고, 신규 이메일은 이름과 함께 계정을 생성합니다.</p></header>
    <ElAlert v-if="errorMessage" :description="errorMessage" title="초대 실패" type="error" :closable="false" />
    <div class="grid gap-3 md:grid-cols-2">
      <ElFormItem class="mb-0!" label="이메일"><ElInput v-model="form.email" type="email" required /></ElFormItem>
      <ElFormItem class="mb-0!" label="신규 계정 이름"><ElInput v-model="form.name" placeholder="기존 계정이면 생략 가능" /></ElFormItem>
    </div>
    <div><ElButton :loading="pending" native-type="submit" type="primary">초대 또는 재초대</ElButton></div>
  </ElForm>
</template>
