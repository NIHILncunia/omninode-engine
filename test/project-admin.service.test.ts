import { describe, expect, it, vi } from 'vitest';
import { createProjectAdminService } from '../server/services/project-admin.service';

describe('project admin service', () => {
  it('soft deletes the assignment and its permission rows together on removal', async () => {
    const softDeleteProjectAdminWithPermissions = vi.fn();
    const service = createProjectAdminService({
      administrators: {} as never,
      permissionService: {
        can: async () => true,
      } as never,
      permissionRepository: {
        findProjectAssignment: async () => ({ delYn: 'N', }),
        softDeleteProjectAdminWithPermissions,
      } as never,
      now: () => new Date('2026-08-16T00:00:00.000Z'),
    });

    await service.remove(1, 10, 2);

    expect(softDeleteProjectAdminWithPermissions).toHaveBeenCalledWith(
      10,
      2,
      1,
      new Date('2026-08-16T00:00:00.000Z'),
    );
  });
});
