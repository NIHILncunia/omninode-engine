import type { AdminRole } from '../../app/types/auth.types';

export interface AccessTokenPayload {
  adminId: number;
  email: string;
  role: AdminRole;
  passwordChangeRequired: boolean;
}
