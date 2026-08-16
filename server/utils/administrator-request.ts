import type { H3Event } from 'h3';
import { adminRoles, type AdminRole, type AuthenticatedAdmin } from '../../app/types/auth.types';
import { getAuthService } from '../services/auth.server';
import { permissionCodes, type PermissionCode, type PermissionGrant } from '../types/permission.types';
import { ApiError } from './api-error';
import { accessCookieName } from './auth-cookie';

export async function getRequestAdmin(event: H3Event): Promise<AuthenticatedAdmin> {
  const accessToken = getCookie(event, accessCookieName);

  if (!accessToken) {
    throw new ApiError(401, 'UNAUTHORIZED');
  }

  return getAuthService().getAuthenticatedAdmin(accessToken);
}

export function readPositiveInteger(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new ApiError(400, 'BAD_REQUEST');
  }

  return parsed;
}

export function readNonNegativeInteger(value: unknown, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new ApiError(400, 'BAD_REQUEST');
  }

  return parsed;
}

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && adminRoles.includes(value as AdminRole);
}

export function isPermissionCode(value: unknown): value is PermissionCode {
  return typeof value === 'string' && permissionCodes.includes(value as PermissionCode);
}

export function isPermissionGrant(value: unknown): value is PermissionGrant {
  return value === 'Y' || value === 'N';
}

export function isYn(value: unknown): value is 'Y' | 'N' {
  return value === 'Y' || value === 'N';
}
