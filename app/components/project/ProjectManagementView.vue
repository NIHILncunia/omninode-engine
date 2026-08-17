<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { computed, reactive } from 'vue';
import { uiFixture, type UiFixtureState } from '~/data/ui-fixture.data';
import UiPageHeader from '~/components/ui/UiPageHeader.vue';
import UiStatePanel from '~/components/ui/UiStatePanel.vue';
import UiStatusBadge from '~/components/ui/UiStatusBadge.vue';
import { cn } from '~/utils/cn';

type ProjectManagementMode = 'list' | 'create' | 'worlds' | 'admins' | 'settings' | 'derived';

const props = withDefaults(defineProps<{
  class?: string;
  mode?: ProjectManagementMode;
  sectionTitle?: string;
  sectionDescription?: string;
  projectId?: string;
}>(), {
  class: undefined,
  mode: 'list',
  sectionTitle: undefined,
  sectionDescription: undefined,
  projectId: undefined,
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

const resolvedProjectId = computed(() => props.projectId ?? String(route.params.projectId ?? uiFixture.projects[0]?.id ?? ''));
const project = computed(() => uiFixture.projects.find((item) => item.id === resolvedProjectId.value) ?? null);
const projectWorlds = computed(() => project.value ? uiFixture.worlds.filter((world) => world.projectId === project.value?.id) : [
]);
const projectAdmins = computed(() => project.value ? uiFixture.admins.filter((admin) => admin.projectIds.includes(project.value?.id ?? '')) : [
]);
const title = computed(() => {
  if (props.mode === 'list') return '프로젝트 목록';
  if (props.mode === 'create') return '새 프로젝트 초안';
  if (props.mode === 'worlds') return `${project.value?.name ?? '프로젝트'} 월드 관리`;
  if (props.mode === 'admins') return `${project.value?.name ?? '프로젝트'} 관리자`;
  if (props.mode === 'settings') return `${project.value?.name ?? '프로젝트'} 설정`;
  return props.sectionTitle ?? '프로젝트 작업 뷰';
});
const description = computed(() => {
  if (props.mode === 'list') return 'fixture 기반 프로젝트 범위를 확인하고 각 프로젝트 대시보드로 이동합니다.';
  if (props.mode === 'create') return '실제 저장 없이 프로젝트 생성 초안을 로컬 다이얼로그에서 확인합니다.';
  if (props.mode === 'derived') return props.sectionDescription ?? '프로젝트 범위 fixture를 바탕으로 한 작업 뷰입니다.';
  return project.value?.description ?? 'fixture 기준 프로젝트 컨텍스트를 찾지 못했습니다.';
});

const form = reactive({
  name: '',
  slug: '',
  description: '',
  status: 'ACTIVE' as UiFixtureState,
});
const dialog = reactive({
  visible: false,
  title: '',
  description: '',
});

const onPreviewProjectCreate = (): void => {
  dialog.visible = true;
  dialog.title = '프로젝트 생성안 확인';
  dialog.description = '저장 없이 검토하는 로컬 초안입니다.';
};

const onOpenLocalNotice = (noticeTitle: string): void => {
  dialog.visible = true;
  dialog.title = noticeTitle;
  dialog.description = '현재 UI 단계에서는 실제 변경 없이 fixture 기반 화면만 확인합니다.';
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
      :description="description"
      :title="title"
    />

    <UiStatePanel
      v-if="props.mode === 'list'"
      description="프로젝트마다 독립된 대시보드 컨텍스트와 관리 진입점을 제공합니다."
      title="프로젝트 관리"
    >
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="item in uiFixture.projects"
          :key="item.id"
          class="flex flex-col gap-4 rounded-2xl border border-black-200 bg-black-50 p-5"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-base font-700 text-black-900">
                {{ item.name }}
              </p>
              <p class="mt-1 text-sm leading-relaxed text-black-600">
                {{ item.description }}
              </p>
            </div>
            <UiStatusBadge :label="item.status" :status="item.status" />
          </div>
          <NuxtLink
            :to="`/projects/${item.id}`"
            class="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-700 text-white"
          >
            대시보드 열기
          </NuxtLink>
        </article>
      </div>
    </UiStatePanel>

    <UiStatePanel
      v-else-if="props.mode === 'create'"
      description="필수 정보를 채우면 로컬 초안 확인 다이얼로그가 열립니다."
      title="프로젝트 기본 정보"
    >
      <ElForm
        data-testid="project-create-form"
        label-position="top"
        @submit.prevent="onPreviewProjectCreate"
      >
        <ElFormItem label="프로젝트 이름">
          <ElInput v-model="form.name" placeholder="예: 프로젝트 위그드라실" />
        </ElFormItem>
        <ElFormItem label="식별자">
          <ElInput v-model="form.slug" placeholder="예: project-yggdrasil" />
        </ElFormItem>
        <ElFormItem label="설명">
          <ElInput v-model="form.description" :rows="4" type="textarea" />
        </ElFormItem>
        <ElFormItem label="초기 상태">
          <ElSelect v-model="form.status">
            <ElOption label="활성" value="ACTIVE" />
            <ElOption label="대기" value="PENDING" />
            <ElOption label="보관" value="ARCHIVED" />
          </ElSelect>
        </ElFormItem>
        <div class="flex justify-end">
          <ElButton native-type="submit" type="primary">
            생성안 확인
          </ElButton>
        </div>
      </ElForm>
    </UiStatePanel>

    <UiStatePanel
      v-else-if="props.mode === 'worlds' && project"
      description="프로젝트 안의 월드 범위와 상태를 확인하고 상세 화면으로 이동합니다."
      title="월드 목록"
    >
      <ElTable :data="projectWorlds" row-key="id">
        <ElTableColumn label="월드" min-width="160">
          <template #default="{ row }">
            <NuxtLink :to="`/projects/${project.id}/worlds/${row.id}`" class="font-700 text-black-900">
              {{ row.name }}
            </NuxtLink>
          </template>
        </ElTableColumn>
        <ElTableColumn label="설명" min-width="280" prop="description" />
        <ElTableColumn label="상태" min-width="120">
          <template #default="{ row }">
            <UiStatusBadge :label="row.status" :status="row.status" />
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="flex justify-end">
        <NuxtLink :to="`/projects/${project.id}/worlds/new`" class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-700 text-white">
          월드 생성
        </NuxtLink>
      </div>
    </UiStatePanel>

    <UiStatePanel
      v-else-if="props.mode === 'admins' && project"
      description="프로젝트 범위에 연결된 관리자 계정을 확인합니다. 실제 권한 변경은 수행하지 않습니다."
      title="프로젝트 관리자"
    >
      <article
        v-for="admin in projectAdmins"
        :key="admin.id"
        class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black-200 bg-black-50 px-4 py-3"
      >
        <div>
          <p class="text-sm font-700 text-black-900">
            {{ admin.name }}
          </p>
          <p class="mt-1 text-xs text-black-500">
            {{ admin.email }} · {{ admin.role }}
          </p>
        </div>
        <UiStatusBadge :label="admin.status" :status="admin.status" />
      </article>
      <div class="flex justify-end">
        <ElButton @click="onOpenLocalNotice('관리자 배정 검토')">
          관리자 배정 검토
        </ElButton>
      </div>
    </UiStatePanel>

    <UiStatePanel
      v-else-if="props.mode === 'settings' && project"
      description="프로젝트 상태와 설명 변경안은 로컬 화면에서만 검토합니다."
      title="프로젝트 설정"
    >
      <ElDescriptions :column="1" border>
        <ElDescriptionsItem label="프로젝트">
          {{ project.name }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="식별자">
          {{ project.slug }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="현재 상태">
          {{ project.status }}
        </ElDescriptionsItem>
      </ElDescriptions>
      <div class="flex justify-end">
        <ElButton @click="onOpenLocalNotice('설정 변경안 확인')">
          변경안 확인
        </ElButton>
      </div>
    </UiStatePanel>

    <UiStatePanel
      v-else
      :description="description"
      :title="props.sectionTitle ?? '프로젝트 작업 뷰'"
    >
      <p class="text-sm leading-relaxed text-black-700">
        {{ project ? `${project.name} 범위의 fixture를 기준으로 표시합니다.` : '프로젝트 컨텍스트를 찾지 못했습니다.' }}
      </p>
      <div class="flex justify-end">
        <ElButton @click="onOpenLocalNotice(props.sectionTitle ?? '작업 확인')">
          로컬 작업 확인
        </ElButton>
      </div>
    </UiStatePanel>

    <ElDialog v-model="dialog.visible" :teleported="false" width="480">
      <template #header>
        <p class="text-lg font-700 text-black-900">
          {{ dialog.title }}
        </p>
      </template>
      <p class="text-sm leading-relaxed text-black-700">
        {{ dialog.description }}
      </p>
      <template #footer>
        <ElButton @click="dialog.visible = false">
          닫기
        </ElButton>
      </template>
    </ElDialog>
  </section>
</template>
