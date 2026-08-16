export const adminRoles = [
  'SUPER_ADMIN',
  'ADMIN',
] as const;

export type AdminRole = typeof adminRoles[number];

export interface AuthenticatedAdmin {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
  passwordChangeRequired: boolean;
}

export const adminRoleLabels: Record<AdminRole, string> = {
  SUPER_ADMIN: '슈퍼 어드민',
  ADMIN: '어드민',
};
