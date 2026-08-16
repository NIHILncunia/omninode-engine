<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { cva } from 'class-variance-authority';
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import type { ProjectAdministrator, ProjectAdministratorListResponse } from '~/types/administrator.types';
import { useProjectAdminStore } from '~/stores/project-admin.store';
import { cn } from '~/utils/cn';

const props = defineProps<{ projectId: number; revision?: number; class?: string }>();
const projectAdminStore = useProjectAdminStore();
const { assignedByProject, } = storeToRefs(projectAdminStore);
const { onSetAssigned, } = projectAdminStore;
const queryClient = useQueryClient();
const cssVariants = cva([
  'flex',
  'flex-col',
  'gap-4',
], {
  variants: {},
  compoundVariants: [
  ],
  defaultVariants: {},
});
const assignedQuery = useQuery({
  queryKey: [
    'project-admins',
    props.projectId,
  ],
  queryFn: () => $fetch<ProjectAdministratorListResponse>(`/api/projects/${props.projectId}/admins`, { credentials: 'include', }),
});
watch(assignedQuery.data, response => {
  if (response?.data) onSetAssigned(props.projectId, response.data);
}, { immediate: true, });
watch(() => props.revision, async () => { await assignedQuery.refetch(); });
const admins = computed(() => assignedByProject.value[props.projectId] ?? [
]);
const removeMutation = useMutation({
  mutationFn: (adminId: number) => $fetch(`/api/projects/${props.projectId}/admins/${adminId}`, {
    method: 'DELETE',
    credentials: 'include',
  }),
  onSuccess: async () => { await queryClient.invalidateQueries({
    queryKey: [
      'project-admins',
      props.projectId,
    ],
  }); },
});

const onExpelProjectAdmin = async (admin: ProjectAdministrator): Promise<void> => {
  if (!confirm(`${admin.name} 관리자의 프로젝트 배정을 해제하시겠습니까?`)) return;
  await removeMutation.mutateAsync(admin.adminId);
};
</script>

<template>
  <section
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
  >
    <LoadingState v-if="assignedQuery.isPending.value" />
    <ErrorState v-else-if="assignedQuery.isError.value" description="프로젝트 관리자 목록을 불러오지 못했습니다." />
    <EmptyState v-else-if="admins.length === 0" description="배정된 관리자가 없습니다." />
    <ElTable v-else :data="admins" border>
      <ElTableColumn label="이름" prop="name" />
      <ElTableColumn label="이메일" prop="email" />
      <ElTableColumn label="계정 상태">
        <template #default="scope">{{ scope.row.accountUseYn === 'Y' ? '활성' : '비활성' }}</template>
      </ElTableColumn>
      <ElTableColumn label="관리" width="140">
        <template #default="scope">
          <ElButton size="small" type="danger" plain :loading="removeMutation.isPending.value" @click="onExpelProjectAdmin(scope.row)">
            배정 해제
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </section>
</template>
