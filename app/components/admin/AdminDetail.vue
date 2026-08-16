<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { onMounted, ref } from 'vue';
import type { AdministratorResponse, AdministratorSummary } from '~/types/administrator.types';
import { adminRoleLabels } from '~/types/auth.types';
import { cn } from '~/utils/cn';

const props = defineProps<{ adminId: number; class?: string }>();
const admin = ref<AdministratorSummary | null>(null);
const pending = ref(false);
const errorMessage = ref<string | null>(null);
const cssVariants = cva([
  'flex',
  'max-w-3xl',
  'flex-col',
  'gap-4',
], {
  variants: {},
  compoundVariants: [
  ],
  defaultVariants: {},
});

const onLoadAdmin = async (): Promise<void> => {
  pending.value = true;
  try {
    const response = await $fetch<AdministratorResponse>(`/api/admins/${props.adminId}`, { credentials: 'include', });
    admin.value = response.data;
  } catch {
    errorMessage.value = '관리자 정보를 불러오지 못했습니다.';
  } finally {
    pending.value = false;
  }
};

const onDeleteAdmin = async (): Promise<void> => {
  if (!confirm('이 관리자 계정을 삭제하시겠습니까?')) return;
  pending.value = true;
  try {
    await $fetch(`/api/admins/${props.adminId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await navigateTo('/admins');
  } catch {
    errorMessage.value = '관리자 계정을 삭제하지 못했습니다.';
    pending.value = false;
  }
};

onMounted(onLoadAdmin);
</script>

<template>
  <section :class="cn([cssVariants({}), props.class])">
    <LoadingState v-if="pending && !admin" />
    <ErrorState v-else-if="errorMessage && !admin" :description="errorMessage" />
    <template v-else-if="admin">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div><h1 class="text-h3 font-700">{{ admin.name }}</h1><p class="text-sm text-black-600">관리자 계정 상세 정보입니다.</p></div>
        <div class="flex gap-2">
          <ElButton @click="navigateTo(`/admins/${admin.id}/permissions`)">권한 설정</ElButton>
          <ElButton type="primary" @click="navigateTo(`/admins/${admin.id}/edit`)">수정</ElButton>
        </div>
      </header>
      <ElAlert v-if="errorMessage" :description="errorMessage" title="처리 실패" type="error" :closable="false" />
      <ElDescriptions :column="1" border>
        <ElDescriptionsItem label="이메일">{{ admin.email }}</ElDescriptionsItem>
        <ElDescriptionsItem label="역할">{{ adminRoleLabels[admin.role] }}</ElDescriptionsItem>
        <ElDescriptionsItem label="상태">{{ admin.useYn === 'Y' ? '활성' : '비활성' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="비밀번호 변경 필요">{{ admin.passwordChangeRequiredYn === 'Y' ? '예' : '아니오' }}</ElDescriptionsItem>
      </ElDescriptions>
      <div><ElButton :loading="pending" type="danger" plain @click="onDeleteAdmin">계정 삭제</ElButton></div>
    </template>
  </section>
</template>
