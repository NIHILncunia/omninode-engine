import type { AdminRole } from './auth.types';
import type { BaseResponse, ListData } from './response.types';

export interface AdministratorSummary {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
  useYn: 'Y' | 'N';
  passwordChangeRequiredYn: 'Y' | 'N';
  lastSignInDate: string | null;
  createDate: string;
  updateDate: string;
}

export interface AdministratorPermission {
  code: string;
  name: string;
  group: string;
  groupName: string;
  defaultGrantYn: 'Y' | 'N';
  overrideGrantYn?: 'Y' | 'N';
  finalGrantYn: 'Y' | 'N';
  assignableYn: 'Y' | 'N';
}

export interface ProjectAdministrator {
  adminId: number;
  email: string;
  name: string;
  role: AdminRole;
  accountUseYn: 'Y' | 'N';
  assignmentUseYn: 'Y' | 'N';
  assignedDate: string;
}

export type AdministratorResponse = BaseResponse<AdministratorSummary>;
export type AdministratorListResponse = BaseResponse<ListData<AdministratorSummary>>;
export type AdministratorPermissionResponse = BaseResponse<AdministratorPermission[]>;
export type ProjectAdministratorResponse = BaseResponse<ProjectAdministrator>;
export type ProjectAdministratorListResponse = BaseResponse<ProjectAdministrator[]>;
