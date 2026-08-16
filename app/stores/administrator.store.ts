import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AdministratorSummary } from '~/types/administrator.types';

export const useAdministratorStore = defineStore('administrator', () => {
  const list = ref<AdministratorSummary[]>([
  ]);
  const totalElements = ref(0);
  const detailById = ref<Record<number, AdministratorSummary>>({});

  const onSetList = (value: { list: AdministratorSummary[]; totalElements: number; }): void => {
    list.value = value.list;
    totalElements.value = value.totalElements;
  };
  const onSetDetail = (value: AdministratorSummary): void => {
    detailById.value[value.id] = value;
  };

  return {
    list,
    totalElements,
    detailById,
    onSetList,
    onSetDetail,
  };
});
