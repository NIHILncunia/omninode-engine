<script setup lang="ts">
import { DateTime } from 'luxon';
import { cva } from 'class-variance-authority';
import { computed, reactive, ref, watch } from 'vue';
import type { FormRules } from 'element-plus';
import type { UiFixtureTemplate, UiFixtureDocument, UiDocumentStatus } from '~/data/ui-fixture.data';
import { uiFixture } from '~/data/ui-fixture.data';
import DocumentOutline from '~/components/docs/DocumentOutline.vue';
import UiFormField from '~/components/ui/UiFormField.vue';
import { cn } from '~/utils/cn';

const props = withDefaults(defineProps<{
  class?: string;
  mode: 'create' | 'edit';
}>(), {
  class: undefined,
});

interface DocumentEditorFormModel {
  title: string;
  categoryId: string;
  templateId: string;
  status: UiDocumentStatus;
  shouldExposeAfterReview: boolean;
  summary: string;
}

const route = useRoute();
const deleteDialogVisible = ref(false);
const initialSaveFeedback = '아직 저장 준비를 실행하지 않았습니다.';
const saveFeedback = ref(initialSaveFeedback);

const cssVariants = cva(
  [
    'grid',
    'gap-6',
    'xl:grid-cols-[minmax(0,2fr)_320px]',
  ],
  {
    variants: {},
    compoundVariants: [
    ],
    defaultVariants: {},
  },
);

const projectId = computed(() => Array.isArray(route.params.projectId) ? route.params.projectId[0] : route.params.projectId);
const worldId = computed(() => Array.isArray(route.params.worldId) ? route.params.worldId[0] : route.params.worldId);
const documentId = computed(() => Array.isArray(route.params.documentId) ? route.params.documentId[0] : route.params.documentId);

const currentProject = computed(() => uiFixture.projects.find((project) => project.id === projectId.value) ?? uiFixture.projects[0]!);
const currentWorld = computed(() => uiFixture.worlds.find((world) => world.id === worldId.value) ?? uiFixture.worlds.find((world) => world.projectId === currentProject.value.id) ?? uiFixture.worlds[0]!);
const currentDocument = computed<UiFixtureDocument | null>(() => {
  if (props.mode !== 'edit') {
    return null;
  }

  return uiFixture.documents.find((document) => document.id === documentId.value && document.worldId === currentWorld.value.id)
    ?? uiFixture.documents.find((document) => document.worldId === currentWorld.value.id)
    ?? null;
});

const categories = computed(() => uiFixture.categories.filter((category) => category.worldId === currentWorld.value.id));
const templates = computed(() => uiFixture.templates.filter((template) => template.worldId === currentWorld.value.id));

const findTemplateForCategory = (categoryId: string | undefined): UiFixtureTemplate | undefined => templates.value.find((template) => template.categoryId === categoryId)
  ?? templates.value[0];

const buildInitialFormState = (document: UiFixtureDocument | null): DocumentEditorFormModel => ({
  title: document?.title ?? '',
  categoryId: document?.categoryId ?? categories.value[0]?.id ?? '',
  templateId: findTemplateForCategory(document?.categoryId ?? categories.value[0]?.id ?? '')?.id ?? '',
  status: document?.status ?? 'DRAFT',
  shouldExposeAfterReview: document?.status === 'PUBLIC',
  summary: document
    ? `${document.title} 문서의 요약 초안을 로컬 fixture 기반으로 검토합니다.`
    : '',
});

const applyFormState = (nextState: DocumentEditorFormModel): void => {
  form.title = nextState.title;
  form.categoryId = nextState.categoryId;
  form.templateId = nextState.templateId;
  form.status = nextState.status;
  form.shouldExposeAfterReview = nextState.shouldExposeAfterReview;
  form.summary = nextState.summary;
};

const form = reactive<DocumentEditorFormModel>({
  ...buildInitialFormState(currentDocument.value),
});

watch(
  () => currentDocument.value,
  (document) => {
    applyFormState(buildInitialFormState(document));
  },
  {
    immediate: true,
  },
);

watch(
  () => form.categoryId,
  (categoryId) => {
    const matchedTemplate = findTemplateForCategory(categoryId);

    if (!templates.value.some((template) => template.id === form.templateId)) {
      form.templateId = matchedTemplate?.id ?? '';

      return;
    }

    const currentTemplate = templates.value.find((template) => template.id === form.templateId);

    if (!currentTemplate || currentTemplate.categoryId !== categoryId) {
      form.templateId = matchedTemplate?.id ?? '';
    }
  },
  {
    immediate: true,
  },
);

const selectedTemplate = computed(() => templates.value.find((template) => template.id === form.templateId) ?? findTemplateForCategory(form.categoryId));
const statusOptions: Array<{ label: string; value: UiDocumentStatus; }> = [
  {
    label: '공개',
    value: 'PUBLIC',
  },
  {
    label: '비공개',
    value: 'PRIVATE',
  },
  {
    label: '초안',
    value: 'DRAFT',
  },
  {
    label: '숨김',
    value: 'HIDDEN',
  },
  {
    label: '삭제',
    value: 'DELETED',
  },
];

const formRules: FormRules<DocumentEditorFormModel> = {
  title: [
    {
      message: '문서 제목을 입력해 주세요.',
      required: true,
      trigger: 'blur',
    },
  ],
  categoryId: [
    {
      message: '카테고리를 선택해 주세요.',
      required: true,
      trigger: 'change',
    },
  ],
  templateId: [
    {
      message: '템플릿을 선택해 주세요.',
      required: true,
      trigger: 'change',
    },
  ],
};

const onSaveDocument = (): void => {
  const timestamp = DateTime.now().toFormat('yyyy.MM.dd HH:mm');

  saveFeedback.value = `저장 준비: ${timestamp} · 로컬 UI 상태만 갱신되었습니다.`;
};

const onCancelEditing = (): void => {
  applyFormState(buildInitialFormState(currentDocument.value));
  saveFeedback.value = initialSaveFeedback;
  deleteDialogVisible.value = false;
};

const onOpenDeleteDialog = (): void => {
  deleteDialogVisible.value = true;
};

const onCloseDeleteDialog = (): void => {
  deleteDialogVisible.value = false;
};
</script>

<template>
  <section
    :class="cn([
      cssVariants({}),
      props.class,
    ])"
  >
    <ElForm
      :model="form"
      :rules="formRules"
      label-position="top"
      class="flex flex-col gap-5 rounded-2xl border border-black-200 bg-white p-6 shadow-sm"
    >
      <div class="flex flex-col gap-2">
        <p class="text-xs font-700 uppercase tracking-[0.18em] text-blue-600">
          {{ props.mode === 'create' ? '새 문서 작성' : '문서 수정' }}
        </p>
        <h1 class="text-2xl font-700 text-black-900">
          {{ props.mode === 'create' ? '새 설정 문서' : '설정 문서 편집' }}
        </h1>
        <p class="text-sm leading-relaxed text-black-600">
          저장 버튼은 서버 요청 없이 현재 화면에만 저장 준비 상태를 표시합니다.
        </p>
      </div>

      <UiFormField
        label="문서 제목"
        required
        description="문서 카드와 우측 편집 목차에서 함께 사용하는 제목입니다."
        data-testid="document-title"
      >
        <ElFormItem prop="title" class="!mb-0">
          <ElInput
            v-model="form.title"
            name="documentTitle"
            placeholder="예: 아미유"
          />
        </ElFormItem>
      </UiFormField>

      <div class="grid gap-4 md:grid-cols-2">
        <UiFormField
          label="카테고리"
          required
          description="현재 월드에 속한 fixture 카테고리만 표시합니다."
        >
          <ElFormItem prop="categoryId" class="!mb-0">
            <ElSelect
              v-model="form.categoryId"
              class="w-full"
              placeholder="카테고리를 선택해 주세요."
            >
              <ElOption
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </ElSelect>
          </ElFormItem>
        </UiFormField>

        <UiFormField
          label="문서 상태"
          required
          description="표시 배지는 현재 선택 상태를 그대로 사용합니다."
        >
          <ElFormItem prop="status" class="!mb-0">
            <ElSelect
              v-model="form.status"
              class="w-full"
              placeholder="문서 상태를 선택해 주세요."
            >
              <ElOption
                v-for="statusOption in statusOptions"
                :key="statusOption.value"
                :label="statusOption.label"
                :value="statusOption.value"
              />
            </ElSelect>
          </ElFormItem>
        </UiFormField>
      </div>

      <UiFormField
        label="편집 템플릿"
        required
        description="카테고리에 맞는 fixture 템플릿으로 목차를 미리 구성합니다."
        data-testid="document-template"
      >
        <ElFormItem prop="templateId" class="!mb-0">
          <ElSelect
            v-model="form.templateId"
            class="w-full"
            placeholder="템플릿을 선택해 주세요."
          >
            <ElOption
              v-for="template in templates.filter((item) => item.categoryId === form.categoryId)"
              :key="template.id"
              :label="template.name"
              :value="template.id"
            />
          </ElSelect>
        </ElFormItem>
        <p class="text-sm text-black-700">
          {{ selectedTemplate?.name ?? '템플릿을 선택해 주세요.' }}
        </p>
        <p class="text-xs leading-relaxed text-black-500">
          {{ selectedTemplate?.description ?? '카테고리와 연결된 로컬 템플릿 설명을 표시합니다.' }}
        </p>
      </UiFormField>

      <UiFormField
        label="요약 메모"
        description="실제 저장 없이 현재 편집 흐름을 메모해 두는 로컬 입력란입니다."
      >
        <ElInput
          v-model="form.summary"
          :autosize="{ minRows: 5, maxRows: 9 }"
          type="textarea"
          placeholder="문서 요약 또는 작업 메모를 입력해 주세요."
        />
      </UiFormField>

      <UiFormField
        label="검토 체크"
        description="외부 권한이나 공개 정책은 바꾸지 않고, 공개 준비 여부만 화면에서 표시합니다."
      >
        <ElCheckbox v-model="form.shouldExposeAfterReview">
          검토 후 공개 후보로 표시
        </ElCheckbox>
      </UiFormField>

      <div class="flex flex-wrap items-center gap-3">
        <ElButton
          type="primary"
          data-testid="document-save"
          @click="onSaveDocument"
        >
          저장 준비
        </ElButton>

        <ElButton
          plain
          data-testid="document-cancel"
          @click="onCancelEditing"
        >
          취소
        </ElButton>

        <ElButton
          v-if="props.mode === 'edit'"
          plain
          type="danger"
          data-testid="document-delete"
          @click="onOpenDeleteDialog"
        >
          삭제 준비
        </ElButton>
      </div>
    </ElForm>

    <DocumentOutline
      :mode="props.mode"
      :project-name="currentProject.name"
      :save-feedback="saveFeedback"
      :section-headings="selectedTemplate?.sectionHeadings ?? []"
      :template-name="selectedTemplate?.name"
      :title="form.title || '새 설정 문서'"
      :world-name="currentWorld.name"
    />

    <ElDialog
      v-model="deleteDialogVisible"
      title="문서 삭제 확인"
      width="min(28rem, 90vw)"
    >
      <div class="flex flex-col gap-3 text-sm text-black-700">
        <p>
          {{ currentDocument?.title ?? '현재 문서' }} 문서를 삭제 후보로 검토합니다.
        </p>
        <p>
          이 대화상자는 실제 삭제를 수행하지 않고, 편집 화면 안에서만 확인 상태를 제공합니다.
        </p>
      </div>

      <template #footer>
        <ElButton @click="onCloseDeleteDialog">
          닫기
        </ElButton>
      </template>
    </ElDialog>
  </section>
</template>
