import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ProjectAdministrator } from '~/types/administrator.types';

export const useProjectAdminStore = defineStore('project-admin', () => {
  const assignedByProject = ref<Record<number, ProjectAdministrator[]>>({});
  const assignableByProject = ref<Record<number, ProjectAdministrator[]>>({});

  const onSetAssigned = (projectId: number, admins: ProjectAdministrator[]): void => {
    assignedByProject.value[projectId] = admins;
  };
  const onSetAssignable = (projectId: number, admins: ProjectAdministrator[]): void => {
    assignableByProject.value[projectId] = admins;
  };

  return {
    assignedByProject,
    assignableByProject,
    onSetAssigned,
    onSetAssignable,
  };
});
