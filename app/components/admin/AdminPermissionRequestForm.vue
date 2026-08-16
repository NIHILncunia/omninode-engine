<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { useMutation } from '@tanstack/vue-query';
import { reactive, ref } from 'vue';
import { useAdminPermissionRequestStore, type AdminPermissionRequestSummary } from '~/stores/admin-permission-request.store';
import { cn } from '~/utils/cn';

const props = defineProps<{ class?: string }>();
const form = reactive({
  email: '',
  name: '',
});
const pending = ref(false);
const completed = ref(false);
const errorMessage = ref<string | null>(null);
const cssVariants = cva([
  'mx-auto',
  'flex',
  'w-full',
  'max-w-md',
  'flex-col',
  'gap-4',
  'p-6',
], {
  variants: {},
  compoundVariants: [
  ],
  defaultVariants: {},
});
const requestStore = useAdminPermissionRequestStore();
const submitMutation = useMutation({
  mutationFn: (input: { email: string; name: string }) => $fetch<{ data: AdminPermissionRequestSummary }>('/api/admin-permission-requests', {
    method: 'POST',
    body: input,
  }),
  onSuccess: response => requestStore.onSetSubmittedRequest(response.data),
});

const onSubmitRequest = async (): Promise<void> => {
  pending.value = true;
  errorMessage.value = null;
  try {
    await submitMutation.mutateAsync({
      email: form.email,
      name: form.name,
    });
    completed.value = true;
  } catch {
    errorMessage.value = '권한 요청을 전송하지 못했습니다. 입력값을 확인한 뒤 다시 시도해 주세요.';
  } finally {
    pending.value = false;
  }
};
</script>

<template>
  <section :class="cn([cssVariants({}), props.class])">
    <header class="flex flex-col gap-1">
      <h1 class="text-h3 font-700">관리자 권한 요청</h1>
      <p class="text-sm text-black-600">승인 후 초기 비밀번호를 이메일로 보내드립니다.</p>
    </header>
    <ElAlert v-if="completed" type="success" :closable="false" title="권한 요청을 전송했습니다." description="슈퍼 어드민의 승인 후 이메일을 확인해 주세요." />
    <ElForm v-else class="flex flex-col gap-2" label-position="top" @submit.prevent="onSubmitRequest">
      <ElFormItem label="이메일" required>
        <ElInput v-model="form.email" type="email" autocomplete="email" />
      </ElFormItem>
      <ElFormItem label="닉네임" required>
        <ElInput v-model="form.name" autocomplete="name" />
      </ElFormItem>
      <ElAlert v-if="errorMessage" type="error" :closable="false" :title="errorMessage" />
      <ElButton type="primary" native-type="submit" :loading="pending">권한 요청</ElButton>
    </ElForm>
  </section>
</template>
