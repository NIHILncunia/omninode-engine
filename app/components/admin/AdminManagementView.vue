<script setup lang="ts">
import { DateTime } from 'luxon';
import { cva } from 'class-variance-authority';
import { computed, reactive, watch } from 'vue';
import { adminRoleLabels, type AdminRole } from '~/types/auth.types';
import { uiFixture, type UiFixtureState } from '~/data/ui-fixture.data';
import UiPageHeader from '~/components/ui/UiPageHeader.vue';
import UiStatePanel from '~/components/ui/UiStatePanel.vue';
import UiStatusBadge from '~/components/ui/UiStatusBadge.vue';
import { cn } from '~/utils/cn';

type AdminManagementMode = 'list' | 'detail' | 'edit';

const props = withDefaults(defineProps<{
  class?: string;
  mode?: AdminManagementMode;
  adminId?: string;
}>(), {
  class: undefined,
  mode: 'list',
  adminId: undefined,
});

const route = useRoute();

const cssVariants = cva(
  [
    'flex',
    'flex-col',
    'gap-5',
  ],
  {
    variants: {},
    compoundVariants: [
    ],
    defaultVariants: {},
  },
);

const statusLabels: Record<UiFixtureState, string> = {
  ACTIVE: '활성',
  ARCHIVED: '보관',
  PENDING: '대기',
};

const projectNameById = computed<Record<string, string>>(() => Object.fromEntries(
  uiFixture.projects.map((project) => [
    project.id,
    project.name,
  ]),
));

const resolvedAdminId = computed(() => props.adminId ?? String(route.params.adminId ?? ''));

const selectedAdmin = computed(() => uiFixture.admins.find((admin) => admin.id === resolvedAdminId.value) ?? null);

const selectedProjects = computed(() => {
  if (!selectedAdmin.value) {
    return [
    ];
  }

  return selectedAdmin.value.projectIds.map((projectId) => ({
    id: projectId,
    name: projectNameById.value[projectId] ?? projectId,
  }));
});

const summaryCards = computed(() => [
  {
    label: '전역 관리자',
    value: String(uiFixture.admins.length),
    detail: `${uiFixture.admins.filter((admin) => admin.role === 'SUPER_ADMIN').length}명 슈퍼 어드민`,
    status: 'ACTIVE',
  },
  {
    label: '활성 관리자',
    value: String(uiFixture.admins.filter((admin) => admin.status === 'ACTIVE').length),
    detail: `${uiFixture.admins.filter((admin) => admin.status !== 'ACTIVE').length}명 비활성 또는 대기`,
    status: 'ACTIVE',
  },
  {
    label: '담당 프로젝트',
    value: String(new Set(uiFixture.admins.flatMap((admin) => admin.projectIds)).size),
    detail: '프로젝트 범위와 역할 검토를 로컬 UI로 점검',
    status: 'ACTIVE',
  },
]);

const adminRows = computed(() => uiFixture.admins.map((admin) => ({
  ...admin,
  roleLabel: adminRoleLabels[admin.role],
  statusLabel: statusLabels[admin.status],
  projectSummary: admin.projectIds.map((projectId) => projectNameById.value[projectId] ?? projectId).join(', '),
  lastSignedInAtLabel: DateTime.fromISO(admin.lastSignedInAt).toFormat('yyyy.MM.dd HH:mm'),
})));

const dialogState = reactive({
  visible: false,
  title: '',
  description: '',
  bullets: [
  ] as string[],
});

const form = reactive({
  role: 'ADMIN' as AdminRole,
  status: 'ACTIVE' as UiFixtureState,
  note: '',
});

watch(selectedAdmin, (admin) => {
  if (!admin) {
    form.role = 'ADMIN';
    form.status = 'ACTIVE';
    form.note = '';
    return;
  }

  form.role = admin.role;
  form.status = admin.status;
  form.note = `${admin.name} 관리자 변경안을 저장 없이 검토합니다.`;
}, { immediate: true, });

const headerTitle = computed(() => {
  if (props.mode === 'detail') {
    return selectedAdmin.value ? `${selectedAdmin.value.name} 상세` : '관리자 상세';
  }

  if (props.mode === 'edit') {
    return selectedAdmin.value ? `${selectedAdmin.value.name} 수정 초안` : '관리자 수정 초안';
  }

  return '관리자 관리';
});

const headerDescription = computed(() => {
  if (props.mode === 'detail') {
    return '계정 상태, 역할, 담당 프로젝트를 읽기 전용 fixture 정보로 검토합니다.';
  }

  if (props.mode === 'edit') {
    return '실제 저장 없이 역할·상태 변경안을 로컬 다이얼로그에서만 미리 확인합니다.';
  }

  return '전역 관리자 목록, 역할, 프로젝트 범위를 fixture 기반 테이블과 로컬 dialog로 관리합니다.';
});

const onOpenAdminAction = (
  admin = selectedAdmin.value,
  action: 'review' | 'detail' | 'edit' = 'review',
): void => {
  if (!admin) {
    return;
  }

  const actionTitleByValue = {
    review: '로컬 검토 메모',
    detail: '상세 검토 메모',
    edit: '변경안 확인',
  } as const;

  dialogState.visible = true;
  dialogState.title = actionTitleByValue[action];
  dialogState.description = `${admin.name} 관리자에 대한 ${action === 'review' ? '운영 메모' : '검토 결과'}를 저장 없이 검토합니다.`;
  dialogState.bullets = [
    `역할: ${adminRoleLabels[admin.role]}`,
    `상태: ${statusLabels[admin.status]}`,
    `담당 프로젝트: ${admin.projectIds.map((projectId) => projectNameById.value[projectId] ?? projectId).join(', ')}`,
  ];
};

const onPreviewDraft = (): void => {
  if (!selectedAdmin.value) {
    return;
  }

  dialogState.visible = true;
  dialogState.title = '변경안 확인';
  dialogState.description = '저장 없이 검토하는 로컬 변경안입니다.';
  dialogState.bullets = [
    `대상 관리자: ${selectedAdmin.value.name}`,
    `변경 역할: ${adminRoleLabels[form.role]}`,
    `변경 상태: ${statusLabels[form.status]}`,
    `메모: ${form.note || '없음'}`,
  ];
};
</script>

<template>
  <section
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
  >
    <UiPageHeader
      :description="headerDescription"
      :title="headerTitle"
    >
      <template #actions>
        <UiStatusBadge
          label="Fixture"
          status="ACTIVE"
        />
      </template>
    </UiPageHeader>

    <div class="grid gap-4 md:grid-cols-3">
      <article
        v-for="summary in summaryCards"
        :key="summary.label"
        class="rounded-2xl border border-black-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-700 uppercase tracking-[0.14em] text-black-500">
              {{ summary.label }}
            </p>
            <p class="mt-2 text-h4 font-700 text-black-900">
              {{ summary.value }}
            </p>
          </div>
          <UiStatusBadge
            label="ACTIVE"
            :status="summary.status"
          />
        </div>
        <p class="mt-3 text-sm leading-relaxed text-black-600">
          {{ summary.detail }}
        </p>
      </article>
    </div>

    <UiStatePanel
      v-if="props.mode === 'list'"
      data-testid="admin-table"
      description="상세·수정 라우트와 별도로, 목록 단계에서는 검토 액션을 모두 로컬 dialog 안에서만 미리 확인합니다."
      title="관리자 테이블"
    >
      <ElTable
        :data="adminRows"
        row-key="id"
      >
        <ElTableColumn
          label="이름"
          min-width="140"
        >
          <template #default="{ row }">
            <div class="flex flex-col gap-1">
              <NuxtLink
                :to="`/admins/${row.id}`"
                class="text-sm font-700 text-black-900"
              >
                {{ row.name }}
              </NuxtLink>
              <span class="text-xs text-black-500">
                {{ row.email }}
              </span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn
          label="역할"
          min-width="120"
        >
          <template #default="{ row }">
            {{ row.roleLabel }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          label="담당 프로젝트"
          min-width="240"
        >
          <template #default="{ row }">
            <span class="text-sm text-black-700">
              {{ row.projectSummary }}
            </span>
          </template>
        </ElTableColumn>

        <ElTableColumn
          label="최근 로그인"
          min-width="160"
        >
          <template #default="{ row }">
            <span class="text-sm text-black-700">
              {{ row.lastSignedInAtLabel }}
            </span>
          </template>
        </ElTableColumn>

        <ElTableColumn
          label="상태"
          min-width="120"
        >
          <template #default="{ row }">
            <UiStatusBadge
              :label="row.statusLabel"
              :status="row.status"
            />
          </template>
        </ElTableColumn>

        <ElTableColumn
          label="검토"
          min-width="140"
        >
          <template #default="{ row }">
            <ElButton
              :data-testid="`open-admin-action-${row.id}`"
              size="small"
              @click="onOpenAdminAction(row, 'review')"
            >
              로컬 검토
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

    </UiStatePanel>

    <template v-else-if="selectedAdmin">
      <UiStatePanel
        v-if="props.mode === 'detail'"
        data-testid="admin-detail"
        description="읽기 전용 fixture 정보로 계정의 역할과 프로젝트 범위를 확인합니다."
        title="기본 정보"
      >
        <div class="grid gap-3 md:grid-cols-2">
          <div class="rounded-2xl border border-black-200 bg-black-50 px-4 py-3">
            <p class="text-xs font-700 uppercase tracking-[0.14em] text-black-500">
              계정
            </p>
            <p class="mt-1 text-sm text-black-800">
              {{ selectedAdmin.email }}
            </p>
          </div>
          <div class="rounded-2xl border border-black-200 bg-black-50 px-4 py-3">
            <p class="text-xs font-700 uppercase tracking-[0.14em] text-black-500">
              역할
            </p>
            <p class="mt-1 text-sm text-black-800">
              {{ adminRoleLabels[selectedAdmin.role] }}
            </p>
          </div>
          <div class="rounded-2xl border border-black-200 bg-black-50 px-4 py-3">
            <p class="text-xs font-700 uppercase tracking-[0.14em] text-black-500">
              상태
            </p>
            <p class="mt-1 text-sm text-black-800">
              {{ statusLabels[selectedAdmin.status] }}
            </p>
          </div>
          <div class="rounded-2xl border border-black-200 bg-black-50 px-4 py-3">
            <p class="text-xs font-700 uppercase tracking-[0.14em] text-black-500">
              마지막 로그인
            </p>
            <p class="mt-1 text-sm text-black-800">
              {{ DateTime.fromISO(selectedAdmin.lastSignedInAt).toFormat('yyyy.MM.dd HH:mm') }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <UiStatusBadge
            v-for="project in selectedProjects"
            :key="project.id"
            :label="project.name"
            status="ACTIVE"
          />
        </div>

        <div class="flex justify-end">
          <ElButton @click="onOpenAdminAction(selectedAdmin, 'detail')">
            상세 검토 메모
          </ElButton>
        </div>
      </UiStatePanel>

      <UiStatePanel
        v-else
        data-testid="admin-edit-form"
        description="실제 저장, API 호출, 권한 변경 없이 수정 초안만 로컬 상태로 유지합니다."
        title="수정 초안"
      >
        <ElForm
          label-position="top"
          @submit.prevent="onPreviewDraft"
        >
          <ElFormItem label="이름">
            <ElInput
              :model-value="selectedAdmin.name"
              readonly
            />
          </ElFormItem>

          <ElFormItem label="역할">
            <ElSelect v-model="form.role">
              <ElOption
                label="슈퍼 어드민"
                value="SUPER_ADMIN"
              />
              <ElOption
                label="어드민"
                value="ADMIN"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="상태">
            <ElSelect v-model="form.status">
              <ElOption
                label="활성"
                value="ACTIVE"
              />
              <ElOption
                label="보관"
                value="ARCHIVED"
              />
              <ElOption
                label="대기"
                value="PENDING"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="검토 메모">
            <ElInput
              v-model="form.note"
              :rows="3"
              type="textarea"
            />
          </ElFormItem>

          <div class="flex justify-end">
            <ElButton
              native-type="submit"
              type="primary"
            >
              변경안 확인
            </ElButton>
          </div>
        </ElForm>
      </UiStatePanel>
    </template>

    <UiStatePanel
      v-else
      description="fixture 기준으로 일치하는 관리자 ID를 찾지 못했습니다."
      title="관리자를 찾을 수 없습니다"
    />

    <ElDialog
      v-model="dialogState.visible"
      :teleported="false"
      width="520"
    >
      <template #header>
        <div class="flex flex-col gap-1">
          <p class="text-lg font-700 text-black-900">
            {{ dialogState.title }}
          </p>
          <p class="text-sm text-black-600">
            {{ dialogState.description }}
          </p>
        </div>
      </template>

      <ul class="flex list-disc flex-col gap-2 pl-5 text-sm text-black-700">
        <li
          v-for="bullet in dialogState.bullets"
          :key="bullet"
        >
          {{ bullet }}
        </li>
      </ul>

      <template #footer>
        <ElButton @click="dialogState.visible = false">
          닫기
        </ElButton>
      </template>
    </ElDialog>
  </section>
</template>
