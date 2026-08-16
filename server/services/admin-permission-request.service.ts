import type { AdminRole } from '../../app/types/auth.types';
import type { AdminCredentialMailer } from '../utils/admin-credential-mailer';
import { ApiError } from '../utils/api-error';
import type {
  AdminPermissionRequestRecord,
  AdminPermissionRequestRepository,
  AdminPermissionRequestSummary,
} from '../types/admin-permission-request.types';

interface RequestAdministratorRepository {
  findByEmail(email: string): Promise<{ id: number; email: string; delYn: 'Y' | 'N' } | undefined>;
  resetTemporaryPassword(adminId: number, passwordHash: string, actorAdminId: number, now: Date): Promise<void>;
}

export interface AdminPermissionRequestServiceDependencies {
  requests: AdminPermissionRequestRepository;
  administrators: RequestAdministratorRepository;
  findActiveAdmin(adminId: number): Promise<{ id: number; role: AdminRole } | undefined>;
  hashPassword(password: string): Promise<string>;
  createTemporaryPassword(): string;
  mailer: AdminCredentialMailer;
  now(): Date;
}

function toSummary(record: AdminPermissionRequestRecord): AdminPermissionRequestSummary {
  const credentialDeliveryStatus = record.credentialDeliveredDate
    ? 'DELIVERED'
    : record.credentialDeliveryFailedDate
      ? 'FAILED'
      : 'PENDING';

  return {
    id: record.id,
    email: record.email,
    name: record.name,
    status: record.status,
    credentialDeliveryStatus,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createAdminPermissionRequestService(dependencies: AdminPermissionRequestServiceDependencies) {
  const requireSuperAdmin = async (adminId: number): Promise<void> => {
    const admin = await dependencies.findActiveAdmin(adminId);

    if (admin?.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'FORBIDDEN');
    }
  };

  const requireConfiguredMailer = (): void => {
    if (!dependencies.mailer.isConfigured()) {
      throw new ApiError(500, 'INTERNAL_SERVER_ERROR');
    }
  };

  const deliverInitialPassword = async (
    request: AdminPermissionRequestRecord,
    password: string,
  ): Promise<void> => {
    try {
      await dependencies.mailer.sendInitialPassword({
        email: request.email,
        name: request.name,
        password,
      });
      await dependencies.requests.markCredentialDelivered(request.id, dependencies.now());
    } catch {
      await dependencies.requests.markCredentialDeliveryFailed(request.id, dependencies.now());
    }
  };

  return {
    async list(actorAdminId: number): Promise<AdminPermissionRequestSummary[]> {
      await requireSuperAdmin(actorAdminId);
      return (await dependencies.requests.list()).map(toSummary);
    },

    async get(actorAdminId: number, requestId: number): Promise<AdminPermissionRequestSummary> {
      await requireSuperAdmin(actorAdminId);
      const request = await dependencies.requests.findById(requestId);
      if (!request) throw new ApiError(404, 'NOT_FOUND');
      return toSummary(request);
    },

    async submit(input: { email: string; name: string }): Promise<AdminPermissionRequestSummary> {
      const email = normalizeEmail(input.email);
      const name = input.name.trim();
      const [
        pending,
        existing,
      ] = await Promise.all([
        dependencies.requests.findPendingByEmail(email),
        dependencies.administrators.findByEmail(email),
      ]);

      if (!email || !name || pending || existing?.delYn === 'N') {
        throw new ApiError(409, 'CONFLICT');
      }

      return toSummary(await dependencies.requests.insert({
        email,
        name,
        now: dependencies.now(),
      }));
    },

    async approve(input: { actorAdminId: number; requestId: number }): Promise<AdminPermissionRequestSummary> {
      await requireSuperAdmin(input.actorAdminId);
      requireConfiguredMailer();
      const request = await dependencies.requests.findById(input.requestId);

      if (!request) {
        throw new ApiError(404, 'NOT_FOUND');
      }

      if (request.status !== 'PENDING') {
        throw new ApiError(409, 'CONFLICT');
      }

      const password = dependencies.createTemporaryPassword();
      const now = dependencies.now();
      const result = await dependencies.requests.approveAndProvisionAdmin({
        requestId: input.requestId,
        passwordHash: await dependencies.hashPassword(password),
        actorAdminId: input.actorAdminId,
        now,
      });

      if (result.status !== 'APPROVED') {
        throw new ApiError(409, 'CONFLICT');
      }

      await deliverInitialPassword(result.request, password);
      return toSummary((await dependencies.requests.findById(input.requestId)) ?? result.request);
    },

    async reject(input: { actorAdminId: number; requestId: number; reason: string }): Promise<AdminPermissionRequestSummary> {
      await requireSuperAdmin(input.actorAdminId);
      const rejected = await dependencies.requests.markRejected(
        input.requestId,
        input.actorAdminId,
        input.reason.trim(),
        dependencies.now(),
      );

      if (!rejected) {
        throw new ApiError(409, 'CONFLICT');
      }

      return toSummary(rejected);
    },

    async resendInitialPassword(input: { actorAdminId: number; requestId: number }): Promise<AdminPermissionRequestSummary> {
      await requireSuperAdmin(input.actorAdminId);
      requireConfiguredMailer();
      const request = await dependencies.requests.findById(input.requestId);

      if (!request) {
        throw new ApiError(404, 'NOT_FOUND');
      }

      if (request.status !== 'APPROVED' || !request.credentialDeliveryFailedDate) {
        throw new ApiError(409, 'CONFLICT');
      }

      const admin = await dependencies.administrators.findByEmail(request.email);
      if (!admin || admin.delYn === 'Y') {
        throw new ApiError(404, 'NOT_FOUND');
      }

      const password = dependencies.createTemporaryPassword();
      await dependencies.administrators.resetTemporaryPassword(
        admin.id,
        await dependencies.hashPassword(password),
        input.actorAdminId,
        dependencies.now(),
      );
      await deliverInitialPassword(request, password);
      return toSummary((await dependencies.requests.findById(input.requestId)) ?? request);
    },
  };
}
