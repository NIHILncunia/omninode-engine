<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { cva } from 'class-variance-authority';
import { reactive, watch } from 'vue';
import type { AdministratorResponse } from '~/types/administrator.types';
import type { AdminRole } from '~/types/auth.types';
import { useAdministratorStore } from '~/stores/administrator.store';
import { cn } from '~/utils/cn';

const props = defineProps<{ adminId: number; class?: string }>();
const administratorStore = useAdministratorStore();
const queryClient = useQueryClient();
const form = reactive({
  name: '',
  role: 'ADMIN' as AdminRole,
  useYn: 'Y' as 'Y' | 'N',
});
const cssVariants = cva([
  'flex',
  'max-w-2xl',
  'flex-col',
  'gap-4',
], {
  variants: {},
  compoundVariants: [
  ],
  defaultVariants: {},
});

const detailQuery = useQuery({
  queryKey: [
    'administrators',
    props.adminId,
  ],
  queryFn: () => $fetch<AdministratorResponse>(`/api/admins/${props.adminId}`, { credentials: 'include', }),
});
watch(detailQuery.data, response => {
  if (response?.data) {
    administratorStore.onSetDetail(response.data);
    form.name = response.data.name;
    form.role = response.data.role;
    form.useYn = response.data.useYn;
  }
}, { immediate: true, });

const onSubmitAdmin = async (): Promise<void> => {
  await updateMutation.mutateAsync();
};

const updateMutation = useMutation({
  mutationFn: () => $fetch(`/api/admins/${props.adminId}`, {
    method: 'PATCH',
    body: form,
    credentials: 'include',
  }),
  onSuccess: async () => {
    await queryClient.invalidateQueries({
      queryKey: [
        'administrators',
      ],
    });
    await navigateTo(`/admins/${props.adminId}`);
  },
});
</script>

<template>
  <LoadingState v-if="detailQuery.isPending.value" />
  <ErrorState v-else-if="detailQuery.isError.value" description="관리자 정보를 불러오지 못했습니다." />
  <ElForm v-else :class="cn([cssVariants({}), props.class])" label-position="top" @submit.prevent="onSubmitAdmin">
    <header>
      <h1 class="text-h3 font-700">관리자 수정</h1>
    </header>
    <ElAlert v-if="updateMutation.isError.value" description="관리자 정보를 수정하지 못했습니다." title="수정 실패" type="error" :closable="false" />
    <ElFormItem label="이름">
      <ElInput v-model="form.name" maxlength="100" required />
    </ElFormItem>
    <ElFormItem label="역할">
      <ElSelect v-model="form.role">
        <ElOption label="슈퍼 어드민" value="SUPER_ADMIN" />
        <ElOption label="어드민" value="ADMIN" />
      </ElSelect>
    </ElFormItem>
    <ElFormItem label="활성 상태">
      <ElSwitch v-model="form.useYn" active-value="Y" inactive-value="N" active-text="활성" inactive-text="비활성" />
    </ElFormItem>
    <div class="flex gap-2">
      <ElButton @click="navigateTo(`/admins/${props.adminId}`)">취소</ElButton>
      <ElButton :loading="updateMutation.isPending.value" native-type="submit" type="primary">저장</ElButton>
    </div>
  </ElForm>
</template>
