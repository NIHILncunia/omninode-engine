import { describe, expect, it } from 'vitest';
import { permissionDefinitions } from '../server/data/permission.data';
import { createPermissionMasterService } from '../server/services/permission-master.service';

describe('permission master service', () => {
  it('synchronizes exactly 18 definitions for an active SUPER_ADMIN actor', async () => {
    const synchronized: Array<{ code: string; name: string; }> = [
    ];
    const service = createPermissionMasterService({
      findActiveAdmin: async adminId => adminId === 99 ? {
        id: 99,
        role: 'SUPER_ADMIN',
      } : undefined,
      synchronizePermissionMasters: async (definitions, actorAdminId, now) => {
        synchronized.push(...definitions);
        expect(actorAdminId).toBe(99);
        expect(now).toEqual(new Date('2026-08-16T00:00:00.000Z'));
      },
      now: () => new Date('2026-08-16T00:00:00.000Z'),
    });

    await expect(service.seed(99)).resolves.toEqual({ count: 18, });
    expect(synchronized).toEqual(permissionDefinitions.map(({ code, name, }) => ({
      code,
      name,
    })));
  });

  it('rejects a seed actor that is not an active SUPER_ADMIN', async () => {
    const service = createPermissionMasterService({
      findActiveAdmin: async () => ({
        id: 2,
        role: 'ADMIN',
      }),
      synchronizePermissionMasters: async () => undefined,
      now: () => new Date('2026-08-16T00:00:00.000Z'),
    });

    await expect(service.seed(2)).rejects.toMatchObject({ code: 'FORBIDDEN', });
  });
});
