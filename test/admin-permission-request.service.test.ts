import { describe, expect, it } from 'vitest';
import { createAdminPermissionRequestService } from '../server/services/admin-permission-request.service';

const now = new Date('2026-08-16T00:00:00.000Z');

function createDependencies() {
  const requests = new Map<number, {
    id: number;
    email: string;
    name: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewedByAdminId: number | null;
    reviewedDate: Date | null;
    rejectionReason: string | null;
    credentialDeliveredDate: Date | null;
    credentialDeliveryFailedDate: Date | null;
  }>();
  const admins = new Map<string, { id: number; email: string; delYn: 'Y' | 'N' }>();
  let nextRequestId = 1;

  return {
    requests,
    admins,
    dependencies: {
      requests: {
        async list() {
          return [
            ...requests.values(),
          ];
        },
        async findPendingByEmail(email: string) {
          return [
            ...requests.values(),
          ].find(request => request.email === email && request.status === 'PENDING');
        },
        async insert(input: { email: string; name: string; now: Date }) {
          const request = {
            id: nextRequestId++,
            email: input.email,
            name: input.name,
            status: 'PENDING' as const,
            reviewedByAdminId: null,
            reviewedDate: null,
            rejectionReason: null,
            credentialDeliveredDate: null,
            credentialDeliveryFailedDate: null,
          };
          requests.set(request.id, request);
          return request;
        },
        async findById(requestId: number) {
          return requests.get(requestId);
        },
        async approveAndProvisionAdmin(input: {
          requestId: number;
          actorAdminId: number;
          passwordHash: string;
          now: Date;
        }) {
          const request = requests.get(input.requestId);
          if (!request || request.status !== 'PENDING') {
            return { status: 'REQUEST_NOT_PENDING' as const, };
          }
          const existing = admins.get(request.email);
          if (existing?.delYn === 'N') {
            return { status: 'ACTIVE_ADMIN_EXISTS' as const, };
          }
          const admin = {
            id: existing?.id ?? admins.size + 1,
            email: request.email,
            delYn: 'N' as const,
          };
          admins.set(request.email, admin);
          request.status = 'APPROVED';
          request.reviewedByAdminId = input.actorAdminId;
          request.reviewedDate = input.now;
          return {
            status: 'APPROVED' as const,
            request,
          };
        },
        async markRejected(requestId: number, actorAdminId: number, reason: string, at: Date) {
          const request = requests.get(requestId);
          if (!request || request.status !== 'PENDING') return undefined;
          request.status = 'REJECTED';
          request.reviewedByAdminId = actorAdminId;
          request.reviewedDate = at;
          request.rejectionReason = reason;
          return request;
        },
        async markCredentialDelivered(requestId: number, at: Date) {
          const request = requests.get(requestId);
          if (!request) return;
          request.credentialDeliveredDate = at;
          request.credentialDeliveryFailedDate = null;
        },
        async markCredentialDeliveryFailed(requestId: number, at: Date) {
          const request = requests.get(requestId);
          if (!request) return;
          request.credentialDeliveryFailedDate = at;
        },
      },
      administrators: {
        async findByEmail(email: string) {
          const admin = admins.get(email);
          return admin ? { ...admin, } : undefined;
        },
        async insert(input: { email: string }) {
          const admin = {
            id: admins.size + 1,
            email: input.email,
            delYn: 'N' as const,
          };
          admins.set(input.email, admin);
          return admin;
        },
        async resetTemporaryPassword() {},
      },
      findActiveAdmin: async (adminId: number) => adminId === 99 ? {
        id: 99,
        role: 'SUPER_ADMIN' as const,
      } : undefined,
      hashPassword: async (password: string) => `hash:${password}`,
      createTemporaryPassword: () => 'temporary-password',
      mailer: {
        isConfigured: () => true,
        async sendInitialPassword() {},
      },
      now: () => now,
    },
  };
}

describe('admin permission request service', () => {
  it('normalizes a public request and prevents a second pending request', async () => {
    const fixture = createDependencies();
    const service = createAdminPermissionRequestService(fixture.dependencies);

    await expect(service.submit({
      email: ' A@Example.com ',
      name: ' 가람 ',
    })).resolves.toMatchObject({
      email: 'a@example.com',
      name: '가람',
      status: 'PENDING',
    });
    await expect(service.submit({
      email: 'a@example.com',
      name: '가람',
    })).rejects.toMatchObject({ code: 'CONFLICT', });
  });

  it('restores a deleted ADMIN when a new request is approved', async () => {
    const fixture = createDependencies();
    fixture.admins.set('a@example.com', {
      id: 1,
      email: 'a@example.com',
      delYn: 'Y',
    });
    const service = createAdminPermissionRequestService(fixture.dependencies);

    const request = await service.submit({
      email: 'a@example.com',
      name: '가람',
    });

    await expect(service.approve({
      actorAdminId: 99,
      requestId: request.id,
    })).resolves.toMatchObject({
      status: 'APPROVED',
    });
    expect(fixture.admins.get('a@example.com')?.delYn).toBe('N');
  });

  it('approves only a pending request and never returns its initial password', async () => {
    const fixture = createDependencies();
    const service = createAdminPermissionRequestService(fixture.dependencies);
    const request = await service.submit({
      email: 'a@example.com',
      name: '가람',
    });

    await expect(service.approve({
      actorAdminId: 99,
      requestId: request.id,
    })).resolves.toEqual({
      id: request.id,
      email: 'a@example.com',
      name: '가람',
      status: 'APPROVED',
      credentialDeliveryStatus: 'DELIVERED',
    });
    expect(fixture.admins.get('a@example.com')).toBeDefined();
  });

  it('rejects an approval request when SMTP is not configured before creating the account', async () => {
    const fixture = createDependencies();
    fixture.dependencies.mailer.isConfigured = () => false;
    const service = createAdminPermissionRequestService(fixture.dependencies);
    const request = await service.submit({
      email: 'a@example.com',
      name: '가람',
    });

    await expect(service.approve({
      actorAdminId: 99,
      requestId: request.id,
    })).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR', });
    expect(fixture.admins.size).toBe(0);
  });
});
