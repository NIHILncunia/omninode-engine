<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { onMounted, reactive, ref } from 'vue';
import type { AdministratorResponse } from '~/types/administrator.types';
import type { AdminRole } from '~/types/auth.types';
import { cn } from '~/utils/cn';

const props = defineProps<{ adminId: number; class?: string }>();
const form = reactive({ name: '', role: 'ADMIN' as AdminRole, useYn: 'Y' as 'Y' | 'N', });
const loading = ref(true);
const submitting = ref(false);
const errorMessage = ref<string | null>(null);
const cssVariants = cva(['flex', 'max-w-2xl', 'flex-col', 'gap-4'], { variants: {}, compoundVariants: [], defaultVariants: {}, });

const onLoadAdmin = async (): Promise<void> => {
  try {
    const response = await $fetch<AdministratorResponse>(`/api/admins/${props.adminId}`, { credentials: 'include', });
    if (!response.data) throw new Error('관리자 정보가 없습니다.');
    form.name = response.data.name;
    form.role = response.data.role;
    form.useYn = response.data.useYn;
  } catch {
    errorMessage.value = '관리자 정보를 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
};

const onSubmitAdmin = async (): Promise<void> => {
  submitting.value = true;
  errorMessage.value = null;
  try {
    await $fetch(`/api/admins/${props.adminId}`, { method: 'PATCH', body: form, credentials: 'include', });
    await navigateTo(`/admins/${props.adminId}`);
  } catch {
    errorMessage.value = '관리자 정보를 수정하지 못했습니다.';
  } finally {
    submitting.value = false;
  }
};

onMounted(onLoadAdmin);
</script>

<template>
  <LoadingState v-if="loading" />
  <ElForm v-else :class="cn([cssVariants({}), props.class])" label-position="top" @submit.prevent="onSubmitAdmin">
    <header><h1 class="text-h3 font-700">관리자 수정</h1></header>
    <ElAlert v-if="errorMessage" :description="errorMessage" title="수정 실패" type="error" :closable="false" />
    <ElFormItem label="이름"><ElInput v-model="form.name" maxlength="100" required /></ElFormItem>
    <ElFormItem label="역할"><ElSelect v-model="form.role"><ElOption label="슈퍼 어드민" value="SUPER_ADMIN" /><ElOption label="어드민" value="ADMIN" /></ElSelect></ElFormItem>
    <ElFormItem label="활성 상태"><ElSwitch v-model="form.useYn" active-value="Y" inactive-value="N" active-text="활성" inactive-text="비활성" /></ElFormItem>
    <div class="flex gap-2"><ElButton @click="navigateTo(`/admins/${props.adminId}`)">취소</ElButton><ElButton :loading="submitting" native-type="submit" type="primary">저장</ElButton></div>
  </ElForm>
</template>
