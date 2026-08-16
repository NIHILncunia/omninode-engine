<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { computed, onMounted, ref } from 'vue';
import type { AdministratorPermission, AdministratorPermissionResponse } from '~/types/administrator.types';
import { cn } from '~/utils/cn';

const props = defineProps<{ adminId: number; class?: string }>();
const permissions = ref<AdministratorPermission[]>([]);
const loading = ref(true);
const submitting = ref(false);
const errorMessage = ref<string | null>(null);
const cssVariants = cva(['flex', 'max-w-4xl', 'flex-col', 'gap-4'], { variants: {}, compoundVariants: [], defaultVariants: {}, });
const groupedPermissions = computed(() => {
  const groups = new Map<string, AdministratorPermission[]>();
  for (const permission of permissions.value) {
    const items = groups.get(permission.groupName) ?? [];
    items.push(permission);
    groups.set(permission.groupName, items);
  }
  return [...groups.entries()];
});

const onLoadAdminPermission = async (): Promise<void> => {
  loading.value = true;
  try {
    const response = await $fetch<AdministratorPermissionResponse>(`/api/admins/${props.adminId}/permissions`, { credentials: 'include', });
    permissions.value = response.data ?? [];
  } catch {
    errorMessage.value = '권한 정보를 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
};

const onUpdateAdminPermission = async (): Promise<void> => {
  submitting.value = true;
  errorMessage.value = null;
  try {
    const response = await $fetch<AdministratorPermissionResponse>(`/api/admins/${props.adminId}/permissions`, {
      method: 'PATCH',
      credentials: 'include',
      body: { permissions: permissions.value.map(item => ({ code: item.code, grantYn: item.finalGrantYn, })), },
    });
    permissions.value = response.data ?? permissions.value;
  } catch {
    errorMessage.value = '권한을 저장하지 못했습니다.';
  } finally {
    submitting.value = false;
  }
};

onMounted(onLoadAdminPermission);
</script>

<template>
  <section :class="cn([cssVariants({}), props.class])">
    <header><h1 class="text-h3 font-700">관리자 권한 설정</h1><p class="text-sm text-black-600">역할 범위 안에서 개별 권한을 허용하거나 차단합니다.</p></header>
    <LoadingState v-if="loading" />
    <ErrorState v-else-if="errorMessage && permissions.length === 0" :description="errorMessage" />
    <EmptyState v-else-if="permissions.length === 0" description="활성 권한 마스터가 없습니다." />
    <template v-else>
      <ElAlert v-if="errorMessage" :description="errorMessage" title="저장 실패" type="error" :closable="false" />
      <section v-for="[groupName, items] in groupedPermissions" :key="groupName" class="rounded-md border border-black-300 bg-white p-4">
        <h2 class="mb-3 text-lg font-700">{{ groupName }}</h2>
        <div v-for="permission in items" :key="permission.code" class="flex items-center justify-between gap-4 border-t border-black-200 py-3 first:border-t-0">
          <div><p>{{ permission.name }}</p><code class="text-xs text-black-500">{{ permission.code }}</code></div>
          <ElSwitch v-model="permission.finalGrantYn" active-value="Y" inactive-value="N" :disabled="permission.assignableYn === 'N'" />
        </div>
      </section>
      <div class="flex gap-2"><ElButton @click="navigateTo(`/admins/${props.adminId}`)">돌아가기</ElButton><ElButton :loading="submitting" type="primary" @click="onUpdateAdminPermission">권한 저장</ElButton></div>
    </template>
  </section>
</template>
