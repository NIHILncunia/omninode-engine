export const adminRoles = [
  'SUPER_ADMIN',
  'ADMIN',
  'SUB_ADMIN',
] as const;

export type AdminRole = typeof adminRoles[number];

export interface AuthenticatedAdmin {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
  passwordChangeRequired: boolean;
}
