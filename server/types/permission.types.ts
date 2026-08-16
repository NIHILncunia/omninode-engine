import type { AdminRole } from '../../app/types/auth.types';

export const permissionCodes = [
  'project.create',
  'project.update',
  'project.delete',
  'world.create',
  'world.update',
  'world.delete',
  'document.create',
  'document.update',
  'document.delete',
  'category.create',
  'category.update',
  'category.delete',
  'template.create',
  'template.update',
  'template.delete',
  'project_sub_admin.invite',
  'project_sub_admin.update',
  'project_sub_admin.expel',
] as const;

export type PermissionCode = typeof permissionCodes[number];
export type PermissionGrant = 'Y' | 'N';

export interface PermissionDecisionInput {
  adminId: number;
  permission: PermissionCode;
  projectId?: number;
}

export interface PermissionAssignmentInput extends PermissionDecisionInput {
  targetAdminId: number;
}

export interface PermissionAdminRecord {
  id: number;
  role: AdminRole;
}

export interface PermissionServiceDependencies {
  findActiveAdmin(adminId: number): Promise<PermissionAdminRecord | undefined>;
  findActiveOverride(adminId: number, code: PermissionCode): Promise<PermissionGrant | undefined>;
  isProjectOwner(projectId: number, adminId: number): Promise<boolean>;
  isAssignedProjectAdmin(projectId: number, adminId: number): Promise<boolean>;
}

export interface PermissionService {
  can(input: PermissionDecisionInput): Promise<boolean>;
  require(input: PermissionDecisionInput): Promise<void>;
  assertAssignable(input: PermissionAssignmentInput): Promise<void>;
}
