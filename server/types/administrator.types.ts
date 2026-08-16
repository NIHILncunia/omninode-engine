import type { AdminRole } from '../../app/types/auth.types';
import type { PermissionCode, PermissionGrant } from './permission.types';

export interface AdminSummary {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
  useYn: 'Y' | 'N';
  passwordChangeRequiredYn: 'Y' | 'N';
  lastSignInDate: Date | null;
  createDate: Date;
  updateDate: Date;
}

export interface AdminDetail extends AdminSummary {
  delYn: 'Y' | 'N';
  passwordHash: string;
  passwordChangeRequiredDate: Date | null;
}

export interface ListResult<TItem> {
  list: TItem[];
  totalElements: number;
}

export interface CreateAdminRecord {
  email: string;
  name: string;
  role: AdminRole;
  passwordHash: string;
  actorAdminId: number;
  now: Date;
}

export interface UpdateAdminRecord {
  name?: string;
  role?: AdminRole;
  useYn?: 'Y' | 'N';
  actorAdminId: number;
  now: Date;
}

export interface AdministratorRepository {
  list(input: { page: number; pageSize: number; search?: string }): Promise<ListResult<AdminSummary>>;
  findById(adminId: number): Promise<AdminDetail | undefined>;
  findByEmail(email: string): Promise<AdminDetail | undefined>;
  insert(input: CreateAdminRecord): Promise<AdminDetail>;
  update(adminId: number, input: UpdateAdminRecord): Promise<AdminDetail>;
  restoreByEmail(email: string, input: CreateAdminRecord): Promise<AdminDetail | undefined>;
  softDelete(adminId: number, actorAdminId: number, now: Date): Promise<void>;
  countActiveSuperAdmins(excludeAdminId?: number): Promise<number>;
  resetTemporaryPassword(adminId: number, passwordHash: string, actorAdminId: number, now: Date): Promise<void>;
}

export interface PermissionMasterRecord {
  id: number;
  code: PermissionCode;
  name: string;
}

export interface AdminPermissionRecord {
  code: PermissionCode;
  grantYn: PermissionGrant;
}

export interface ProjectAdminSummary {
  adminId: number;
  email: string;
  name: string;
  role: AdminRole;
  accountUseYn: 'Y' | 'N';
  assignmentUseYn: 'Y' | 'N';
  assignedDate: Date;
}

export interface PermissionRepository {
  synchronizePermissionMasters(definitions: readonly { code: PermissionCode; name: string }[], actorAdminId: number, now: Date): Promise<void>;
  findActiveAdmin(adminId: number): Promise<{ id: number; role: AdminRole } | undefined>;
  hasActiveProjectAssignment(projectId: number, adminId: number): Promise<boolean>;
  findActiveProjectPermission(projectId: number, adminId: number, code: PermissionCode): Promise<PermissionGrant | undefined>;
  isProjectOwner(projectId: number, adminId: number): Promise<boolean>;
  isAssignedProjectAdmin(projectId: number, adminId: number): Promise<boolean>;
  listPermissionMasters(): Promise<PermissionMasterRecord[]>;
  findPermissionMaster(code: PermissionCode): Promise<PermissionMasterRecord | undefined>;
  listProjectAdmins(projectId: number): Promise<ProjectAdminSummary[]>;
  findProjectAssignment(projectId: number, adminId: number): Promise<{ delYn: 'Y' | 'N' } | undefined>;
  upsertProjectAssignment(projectId: number, adminId: number, actorAdminId: number, now: Date): Promise<void>;
  updateProjectAssignment(projectId: number, adminId: number, useYn: 'Y' | 'N', actorAdminId: number, now: Date): Promise<void>;
  softDeleteProjectAdminWithPermissions(projectId: number, adminId: number, actorAdminId: number, now: Date): Promise<void>;
  assignProjectAdmin(input: {
    projectId: number;
    adminId: number;
    grants: Record<PermissionCode, PermissionGrant>;
    actorAdminId: number;
    now: Date;
  }): Promise<void>;
}
