import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface AdminPermissionRequestSummary {
  id: number;
  email: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  credentialDeliveryStatus: 'PENDING' | 'DELIVERED' | 'FAILED';
}

export const useAdminPermissionRequestStore = defineStore('admin-permission-request', () => {
  const requests = ref<AdminPermissionRequestSummary[]>([]);
  const submittedRequest = ref<AdminPermissionRequestSummary | null>(null);

  const onSetRequests = (value: AdminPermissionRequestSummary[]): void => {
    requests.value = value;
  };
  const onSetSubmittedRequest = (value: AdminPermissionRequestSummary): void => {
    submittedRequest.value = value;
  };

  return { requests, submittedRequest, onSetRequests, onSetSubmittedRequest, };
});
