<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { onMounted, ref } from 'vue';
import type { AdministratorListResponse, AdministratorSummary } from '~/types/administrator.types';
import { adminRoleLabels } from '~/types/auth.types';
import { cn } from '~/utils/cn';

const props = defineProps<{ class?: string }>();
const admins = ref<AdministratorSummary[]>([]);
const search = ref('');
const page = ref(0);
const pageSize = 20;
const total = ref(0);
const pending = ref(false);
const errorMessage = ref<string | null>(null);

const cssVariants = cva(['flex', 'flex-col', 'gap-4'], { variants: {}, compoundVariants: [], defaultVariants: {}, });

const onLoadAdmin = async (): Promise<void> => {
  pending.value = true;
  errorMessage.value = null;
  try {
    const response = await $fetch<AdministratorListResponse>('/api/admins', {
      query: { page: page.value, pageSize, search: search.value || undefined, },
      credentials: 'include',
    });
    admins.value = response.data?.list ?? [];
    total.value = response.data?.totalElements ?? 0;
  } catch {
    errorMessage.value = '관리자 목록을 불러오지 못했습니다.';
  } finally {
    pending.value = false;
  }
};

const onSearchAdmin = async (): Promise<void> => {
  page.value = 0;
  await onLoadAdmin();
};

const onChangeAdminPage = async (value: number): Promise<void> => {
  page.value = value - 1;
  await onLoadAdmin();
};

onMounted(onLoadAdmin);
</script>

<template>
  <section :class="cn([cssVariants({}), props.class])">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-h3 font-700">관리자</h1>
        <p class="text-sm text-black-600">전역 관리자 계정과 상태를 관리합니다.</p>
      </div>
      <ElButton type="primary" @click="navigateTo('/admins/new')">관리자 생성</ElButton>
    </header>

    <ElForm class="flex gap-2" @submit.prevent="onSearchAdmin">
      <ElInput v-model="search" clearable placeholder="이름 또는 이메일 검색" />
      <ElButton native-type="submit">검색</ElButton>
    </ElForm>

    <LoadingState v-if="pending" />
    <ErrorState v-else-if="errorMessage" :description="errorMessage" />
    <EmptyState v-else-if="admins.length === 0" description="검색 조건에 맞는 관리자가 없습니다." />
    <template v-else>
      <ElTable :data="admins" border>
        <ElTableColumn label="이름" prop="name">
          <template #default="scope">
            <NuxtLink class="text-blue-600 hover:underline" :to="`/admins/${scope.row.id}`">
              {{ scope.row.name }}
            </NuxtLink>
          </template>
        </ElTableColumn>
        <ElTableColumn label="이메일" prop="email" />
        <ElTableColumn label="역할">
          <template #default="scope">{{ adminRoleLabels[scope.row.role as keyof typeof adminRoleLabels] }}</template>
        </ElTableColumn>
        <ElTableColumn label="상태">
          <template #default="scope">
            <ElTag :type="scope.row.useYn === 'Y' ? 'success' : 'info'">
              {{ scope.row.useYn === 'Y' ? '활성' : '비활성' }}
            </ElTag>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination
        background
        layout="prev, pager, next, total"
        :current-page="page + 1"
        :page-size="pageSize"
        :total="total"
        @current-change="onChangeAdminPage"
      />
    </template>
  </section>
</template>
