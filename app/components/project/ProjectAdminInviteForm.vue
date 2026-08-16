<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { cva } from 'class-variance-authority';
import { computed, reactive, ref, watch } from 'vue';
import type { ProjectAdministratorListResponse } from '~/types/administrator.types';
import { useProjectAdminStore } from '~/stores/project-admin.store';
import { cn } from '~/utils/cn';

const props = defineProps<{ projectId: number; class?: string }>();
const emit = defineEmits<{ assigned: [] }>();
const projectAdminStore = useProjectAdminStore();
const queryClient = useQueryClient();
const dialogVisible = ref(false);
const selectedAdminId = ref<number>();
const errorMessage = ref<string | null>(null);
const permissionGroups = [
  {
    label: '프로젝트',
    codes: [
      'project.create',
      'project.update',
      'project.delete',
    ],
  },
  {
    label: '월드',
    codes: [
      'world.create',
      'world.update',
      'world.delete',
    ],
  },
  {
    label: '카테고리',
    codes: [
      'category.create',
      'category.update',
      'category.delete',
    ],
  },
  {
    label: '템플릿',
    codes: [
      'template.create',
      'template.update',
      'template.delete',
    ],
  },
  {
    label: '문서',
    codes: [
      'document.create',
      'document.update',
      'document.delete',
    ],
  },
  {
    label: '관리자',
    codes: [
      'project_sub_admin.invite',
      'project_sub_admin.update',
      'project_sub_admin.expel',
    ],
  },
] as const;
const permissions = reactive<Record<string, 'Y' | 'N'>>({});
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
const availableQuery = useQuery({
  queryKey: [
    'project-admins',
    props.projectId,
    'available',
  ],
  queryFn: () => $fetch<ProjectAdministratorListResponse>(`/api/projects/${props.projectId}/admins/available`, { credentials: 'include', }),
});
watch(availableQuery.data, response => {
  if (response?.data) projectAdminStore.onSetAssignable(props.projectId, response.data);
}, { immediate: true, });
const availableAdmins = computed(() => projectAdminStore.assignableByProject[props.projectId] ?? [
]);
const assignMutation = useMutation({
  mutationFn: () => $fetch(`/api/projects/${props.projectId}/admins`, {
    method: 'POST',
    credentials: 'include',
    body: {
      adminId: selectedAdminId.value,
      permissions,
    },
  }),
  onSuccess: async () => {
    await queryClient.invalidateQueries({
      queryKey: [
        'project-admins',
        props.projectId,
      ],
    });
    emit('assigned');
  },
});

const onOpenAssignDialog = (): void => {
  selectedAdminId.value = undefined;
  errorMessage.value = null;
  for (const group of permissionGroups) {
    for (const code of group.codes) permissions[code] = 'N';
  }
  dialogVisible.value = true;
};
const onAssignProjectAdmin = async (): Promise<void> => {
  if (!selectedAdminId.value) {
    errorMessage.value = '배정할 관리자를 선택해 주세요.';
    return;
  }
  try {
    await assignMutation.mutateAsync();
    dialogVisible.value = false;
  } catch {
    errorMessage.value = '프로젝트 관리자 배정을 저장하지 못했습니다.';
  }
};
const onTogglePermission = (code: string, value: boolean): void => {
  permissions[code] = value ? 'Y' : 'N';
};
</script>

<template>
  <section :class="cn([cssVariants({}), props.class])">
    <ElButton type="primary" @click="onOpenAssignDialog">관리자 배정</ElButton>
    <ElDialog v-model="dialogVisible" title="프로젝트 관리자 배정" width="min(48rem, 90vw)">
      <div class="flex flex-col gap-3">
        <p class="text-sm text-black-600">승인된 기존 관리자만 프로젝트에 배정할 수 있습니다.</p>
        <ElAlert v-if="errorMessage" type="error" :closable="false" :title="errorMessage" />
        <ElForm label-position="top" class="flex flex-col gap-2">
          <ElFormItem label="관리자" required>
            <ElSelect v-model="selectedAdminId" placeholder="관리자를 선택해 주세요">
              <ElOption
                v-for="admin in availableAdmins"
                :key="admin.adminId"
                :label="`${admin.name} (${admin.email})`"
                :value="admin.adminId"
              />
            </ElSelect>
          </ElFormItem>
          <div class="grid gap-3 md:grid-cols-2">
            <section v-for="group in permissionGroups" :key="group.label" class="rounded-md border border-black-200 p-3">
              <h3 class="font-600">{{ group.label }}</h3>
              <div class="mt-2 grid grid-cols-3 gap-2">
                <ElCheckbox
                  v-for="code in group.codes"
                  :key="code"
                  :model-value="permissions[code] === 'Y'"
                  @update:model-value="onTogglePermission(code, $event)"
                >
                  {{ code.split('.').at(-1)?.toUpperCase() }}
                </ElCheckbox>
              </div>
            </section>
          </div>
        </ElForm>
      </div>
      <template #footer>
        <ElButton @click="dialogVisible = false">취소</ElButton>
        <ElButton type="primary" :loading="assignMutation.isPending.value" @click="onAssignProjectAdmin">저장</ElButton>
      </template>
    </ElDialog>
  </section>
</template>
