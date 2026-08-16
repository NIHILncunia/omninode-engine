import type { PermissionCode, PermissionGrant } from '../../../types/permission.types';
import { getAdministratorServices } from '../../../services/administrator.server';
import {
  getRequestAdmin,
  isPermissionCode,
  isPermissionGrant,
  readPositiveInteger,
} from '../../../utils/administrator-request';
import { readValidatedAuthBody, toAuthErrorResponse } from '../../../utils/auth-request';
import { CreateResponse } from '../../../utils/createResponse';

interface PermissionUpdateBody {
  permissions: { code: PermissionCode; grantYn: PermissionGrant }[];
}

function isPermissionUpdateBody(body: unknown): body is PermissionUpdateBody {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const value = body as Record<string, unknown>;
  return Array.isArray(value.permissions)
    && value.permissions.length <= 18
    && value.permissions.every(item => {
      if (typeof item !== 'object' || item === null) {
        return false;
      }
      const permission = item as Record<string, unknown>;
      return isPermissionCode(permission.code) && isPermissionGrant(permission.grantYn);
    });
}

export default defineEventHandler(async event => {
  try {
    const actor = await getRequestAdmin(event);
    const adminId = readPositiveInteger(getRouterParam(event, 'adminId'));
    const body = await readValidatedAuthBody(event, isPermissionUpdateBody);
    const permissions = await getAdministratorServices().administrators.updatePermissions(
      actor.id,
      adminId,
      body.permissions,
    );
    return CreateResponse.data(permissions);
  } catch (error) {
    return toAuthErrorResponse(event, error);
  }
});
