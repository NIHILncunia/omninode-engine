<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { reactive, ref } from 'vue';
import type { AdministratorResponse } from '~/types/administrator.types';
import { cn } from '~/utils/cn';

const props = defineProps<{ class?: string }>();
const form = reactive({ email: '', name: '', role: 'ADMIN' as 'ADMIN' | 'SUB_ADMIN', });
const pending = ref(false);
const errorMessage = ref<string | null>(null);
const cssVariants = cva(['flex', 'max-w-2xl', 'flex-col', 'gap-4'], { variants: {}, compoundVariants: [], defaultVariants: {}, });

const onSubmitAdmin = async (): Promise<void> => {
  pending.value = true;
  errorMessage.value = null;
  try {
    const response = await $fetch<AdministratorResponse>('/api/admins', {
      method: 'POST', body: form, credentials: 'include',
    });
    if (!response.data) throw new Error('관리자 생성 결과가 없습니다.');
    await navigateTo(`/admins/${response.data.id}`);
  } catch {
    errorMessage.value = '관리자를 생성하지 못했습니다. 이메일 중복 여부를 확인해 주세요.';
  } finally {
    pending.value = false;
  }
};
</script>

<template>
  <ElForm :class="cn([cssVariants({}), props.class])" label-position="top" @submit.prevent="onSubmitAdmin">
    <header><h1 class="text-h3 font-700">관리자 생성</h1><p class="text-sm text-black-600">임시 비밀번호가 발급되고 최초 로그인 시 변경이 요구됩니다.</p></header>
    <ElAlert v-if="errorMessage" :description="errorMessage" title="생성 실패" type="error" :closable="false" />
    <ElFormItem label="이름"><ElInput v-model="form.name" maxlength="100" required /></ElFormItem>
    <ElFormItem label="이메일"><ElInput v-model="form.email" maxlength="320" type="email" required /></ElFormItem>
    <ElFormItem label="역할">
      <ElSelect v-model="form.role"><ElOption label="어드민" value="ADMIN" /><ElOption label="서브 어드민" value="SUB_ADMIN" /></ElSelect>
    </ElFormItem>
    <div class="flex gap-2"><ElButton @click="navigateTo('/admins')">취소</ElButton><ElButton :loading="pending" native-type="submit" type="primary">생성</ElButton></div>
  </ElForm>
</template>
