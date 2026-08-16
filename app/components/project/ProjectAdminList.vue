<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { onMounted, ref, watch } from 'vue';
import type { ProjectAdministrator, ProjectAdministratorListResponse } from '~/types/administrator.types';
import { cn } from '~/utils/cn';

const props = defineProps<{ projectId: number; revision?: number; class?: string }>();
const admins = ref<ProjectAdministrator[]>([]);
const pending = ref(false);
const errorMessage = ref<string | null>(null);
const cssVariants = cva(['flex', 'flex-col', 'gap-4'], { variants: {}, compoundVariants: [], defaultVariants: {}, });

const onLoadProjectAdmin = async (): Promise<void> => {
  pending.value = true;
  errorMessage.value = null;
  try {
    const response = await $fetch<ProjectAdministratorListResponse>(`/api/projects/${props.projectId}/admins`, { credentials: 'include', });
    admins.value = response.data ?? [];
  } catch {
    errorMessage.value = '프로젝트 관리자 목록을 불러오지 못했습니다.';
  } finally {
    pending.value = false;
  }
};

const onUpdateProjectAdmin = async (admin: ProjectAdministrator): Promise<void> => {
  const useYn = admin.assignmentUseYn === 'Y' ? 'N' : 'Y';
  try {
    await $fetch(`/api/projects/${props.projectId}/admins/${admin.adminId}`, { method: 'PATCH', credentials: 'include', body: { useYn, }, });
    await onLoadProjectAdmin();
  } catch {
    errorMessage.value = '프로젝트 관리자 상태를 변경하지 못했습니다.';
  }
};

const onExpelProjectAdmin = async (admin: ProjectAdministrator): Promise<void> => {
  if (!confirm(`${admin.name} 관리자의 프로젝트 배정을 해제하시겠습니까?`)) return;
  try {
    await $fetch(`/api/projects/${props.projectId}/admins/${admin.adminId}`, { method: 'DELETE', credentials: 'include', });
    await onLoadProjectAdmin();
  } catch {
    errorMessage.value = '프로젝트 관리자 배정을 해제하지 못했습니다.';
  }
};

watch(() => props.revision, onLoadProjectAdmin);
onMounted(onLoadProjectAdmin);
</script>

<template>
  <section :class="cn([cssVariants({}), props.class])">
    <LoadingState v-if="pending" />
    <ErrorState v-else-if="errorMessage && admins.length === 0" :description="errorMessage" />
    <EmptyState v-else-if="admins.length === 0" description="배정된 서브 어드민이 없습니다." />
    <template v-else>
      <ElAlert v-if="errorMessage" :description="errorMessage" title="처리 실패" type="error" :closable="false" />
      <ElTable :data="admins" border>
        <ElTableColumn label="이름" prop="name" />
        <ElTableColumn label="이메일" prop="email" />
        <ElTableColumn label="계정 상태"><template #default="scope">{{ scope.row.accountUseYn === 'Y' ? '활성' : '비활성' }}</template></ElTableColumn>
        <ElTableColumn label="배정 상태"><template #default="scope"><ElTag :type="scope.row.assignmentUseYn === 'Y' ? 'success' : 'info'">{{ scope.row.assignmentUseYn === 'Y' ? '활성' : '비활성' }}</ElTag></template></ElTableColumn>
        <ElTableColumn label="관리" width="220">
          <template #default="scope">
            <div class="flex gap-2">
              <ElButton size="small" @click="onUpdateProjectAdmin(scope.row)">{{ scope.row.assignmentUseYn === 'Y' ? '비활성화' : '활성화' }}</ElButton>
              <ElButton size="small" type="danger" plain @click="onExpelProjectAdmin(scope.row)">배정 해제</ElButton>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>
    </template>
  </section>
</template>
