import { describe, expect, it } from 'vitest';
import { createPermissionService } from '../server/services/permission.service';

describe('project permission service', () => {
  const service = createPermissionService({
    findActiveAdmin: async adminId => {
      if (adminId === 1) return {
        id: 1,
        role: 'SUPER_ADMIN',
      };
      if (adminId === 2) return {
        id: 2,
        role: 'ADMIN',
      };
      return undefined;
    },
    hasActiveProjectAssignment: async () => true,
    findActiveProjectPermission: async (projectId, adminId, code) => (
      projectId === 10 && adminId === 2 && code === 'world.create' ? 'Y' : 'N'
    ),
  });

  it('allows a project grant only within the assigned project', async () => {
    await expect(service.can({
      adminId: 2,
      projectId: 10,
      permission: 'world.create',
    })).resolves.toBe(true);
    await expect(service.can({
      adminId: 2,
      projectId: 11,
      permission: 'world.create',
    })).resolves.toBe(false);
  });

  it('does not authorize a permission when the project assignment is inactive', async () => {
    const service = createPermissionService({
      findActiveAdmin: async () => ({
        id: 2,
        role: 'ADMIN',
      }),
      hasActiveProjectAssignment: async () => false,
      findActiveProjectPermission: async () => 'Y',
    });

    await expect(service.can({
      adminId: 2,
      projectId: 10,
      permission: 'world.create',
    })).resolves.toBe(false);
  });

  it('allows a SUPER_ADMIN without a project permission row', async () => {
    await expect(service.can({
      adminId: 1,
      projectId: 11,
      permission: 'world.create',
    })).resolves.toBe(true);
  });

  it('allows project creation for an active ADMIN before project assignment', async () => {
    await expect(service.can({
      adminId: 2,
      permission: 'project.create',
    })).resolves.toBe(true);
  });
});
