<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { cva } from 'class-variance-authority';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useAdminPermissionRequestStore, type AdminPermissionRequestSummary } from '~/stores/admin-permission-request.store';
import { cn } from '~/utils/cn';

const props = defineProps<{ class?: string }>();
const requestStore = useAdminPermissionRequestStore();
const { requests, } = storeToRefs(requestStore);
const { onSetRequests, } = requestStore;
const queryClient = useQueryClient();
const selectedRequest = ref<AdminPermissionRequestSummary | null>(null);
const dialogVisible = ref(false);
const rejectionReason = ref('');
const cssVariants = cva([
  'flex',
  'flex-col',
  'gap-3',
], {
  variants: {},
  compoundVariants: [
  ],
  defaultVariants: {},
});
const listQuery = useQuery({
  queryKey: [
    'admin-permission-requests',
  ],
  queryFn: () => $fetch<{ data: AdminPermissionRequestSummary[] }>('/api/admin-permission-requests', { credentials: 'include', }),
});
watch(listQuery.data, response => {
  if (response?.data) onSetRequests(response.data);
}, { immediate: true, });
const reviewMutation = useMutation({
  mutationFn: (input: { requestId: number; action: 'approve' | 'reject' | 'resend'; reason?: string }) => {
    const suffix = input.action === 'resend' ? 'resend-initial-password' : input.action;
    return $fetch(`/api/admin-permission-requests/${input.requestId}/${suffix}`, {
      method: 'POST',
      credentials: 'include',
      ...(input.action === 'reject' ? { body: { reason: input.reason, }, } : {}),
    });
  },
  onSuccess: async () => { await queryClient.invalidateQueries({
    queryKey: [
      'admin-permission-requests',
    ],
  }); },
});
const canResend = computed(() => selectedRequest.value?.credentialDeliveryStatus === 'FAILED');

const onOpenReviewDialog = (request: AdminPermissionRequestSummary): void => {
  selectedRequest.value = request;
  rejectionReason.value = '';
  dialogVisible.value = true;
};
const onReview = async (action: 'approve' | 'reject' | 'resend'): Promise<void> => {
  if (!selectedRequest.value) return;
  await reviewMutation.mutateAsync({
    requestId: selectedRequest.value.id,
    action,
    reason: rejectionReason.value,
  });
  dialogVisible.value = false;
};
</script>

<template>
  <section :class="cn([cssVariants({}), props.class])">
    <header>
      <h2 class="text-xl font-700">관리자 권한 요청</h2>
      <p class="text-sm text-black-600">요청을 검토한 뒤 승인하면 초기 비밀번호가 이메일로 전송됩니다.</p>
    </header>
    <LoadingState v-if="listQuery.isPending.value" />
    <ErrorState v-else-if="listQuery.isError.value" description="권한 요청 목록을 불러오지 못했습니다." />
    <EmptyState v-else-if="requests.length === 0" description="대기 중인 권한 요청이 없습니다." />
    <ElTable v-else :data="requests" border>
      <ElTableColumn prop="name" label="닉네임" />
      <ElTableColumn prop="email" label="이메일" />
      <ElTableColumn prop="status" label="상태" />
      <ElTableColumn prop="credentialDeliveryStatus" label="초기 비밀번호" />
      <ElTableColumn label="검토">
        <template #default="scope">
          <ElButton @click="onOpenReviewDialog(scope.row)">검토</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
    <ElDialog v-model="dialogVisible" title="관리자 권한 요청 검토" width="min(32rem, 90vw)">
      <div class="flex flex-col gap-2">
        <p>{{ selectedRequest?.name }} · {{ selectedRequest?.email }}</p>
        <ElInput v-model="rejectionReason" type="textarea" placeholder="거절 사유" />
      </div>
      <template #footer>
        <ElButton @click="dialogVisible = false">취소</ElButton>
        <ElButton v-if="canResend" :loading="reviewMutation.isPending.value" @click="onReview('resend')">
          초기 비밀번호 재발송
        </ElButton>
        <ElButton type="danger" :loading="reviewMutation.isPending.value" @click="onReview('reject')">거절</ElButton>
        <ElButton type="primary" :loading="reviewMutation.isPending.value" @click="onReview('approve')">승인</ElButton>
      </template>
    </ElDialog>
  </section>
</template>
