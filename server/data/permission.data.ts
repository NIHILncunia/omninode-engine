import type { AdminRole } from '../../app/types/auth.types';
import type { PermissionCode } from '../types/permission.types';

export const permissionGroups = {
  project: '프로젝트 관리',
  world: '월드 관리',
  document: '설정 문서 관리',
  category: '카테고리 관리',
  template: '템플릿 관리',
  project_sub_admin: '프로젝트 관리자 관리',
} as const;

export type PermissionGroupCode = keyof typeof permissionGroups;

export interface PermissionDefinition {
  code: PermissionCode;
  name: string;
  group: PermissionGroupCode;
}

export const permissionDefinitions: readonly PermissionDefinition[] = [
  { code: 'project.create', name: '프로젝트 생성', group: 'project', },
  { code: 'project.update', name: '프로젝트 수정', group: 'project', },
  { code: 'project.delete', name: '프로젝트 삭제', group: 'project', },
  { code: 'world.create', name: '월드 생성', group: 'world', },
  { code: 'world.update', name: '월드 수정', group: 'world', },
  { code: 'world.delete', name: '월드 삭제', group: 'world', },
  { code: 'document.create', name: '설정 문서 생성', group: 'document', },
  { code: 'document.update', name: '설정 문서 수정', group: 'document', },
  { code: 'document.delete', name: '설정 문서 삭제', group: 'document', },
  { code: 'category.create', name: '카테고리 생성', group: 'category', },
  { code: 'category.update', name: '카테고리 수정', group: 'category', },
  { code: 'category.delete', name: '카테고리 삭제', group: 'category', },
  { code: 'template.create', name: '템플릿 생성', group: 'template', },
  { code: 'template.update', name: '템플릿 수정', group: 'template', },
  { code: 'template.delete', name: '템플릿 삭제', group: 'template', },
  { code: 'project_sub_admin.invite', name: '프로젝트 서브 어드민 초대', group: 'project_sub_admin', },
  { code: 'project_sub_admin.update', name: '프로젝트 서브 어드민 수정', group: 'project_sub_admin', },
  { code: 'project_sub_admin.expel', name: '프로젝트 서브 어드민 배정 해제', group: 'project_sub_admin', },
] as const;

const subAdminPermissionCodes = new Set<PermissionCode>([
  'document.create',
  'document.update',
  'document.delete',
  'category.create',
  'category.update',
  'category.delete',
  'template.create',
  'template.update',
  'template.delete',
]);

export function hasRoleDefaultPermission(role: AdminRole, code: PermissionCode): boolean {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return true;
  }

  return subAdminPermissionCodes.has(code);
}
