export const adminPermissionRequestStatuses = [
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const;

export type AdminPermissionRequestStatus = typeof adminPermissionRequestStatuses[number];

export interface AdminPermissionRequestRecord {
  id: number;
  email: string;
  name: string;
  status: AdminPermissionRequestStatus;
  reviewedByAdminId: number | null;
  reviewedDate: Date | null;
  rejectionReason: string | null;
  credentialDeliveredDate: Date | null;
  credentialDeliveryFailedDate: Date | null;
}

export interface AdminPermissionRequestSummary {
  id: number;
  email: string;
  name: string;
  status: AdminPermissionRequestStatus;
  credentialDeliveryStatus: 'PENDING' | 'DELIVERED' | 'FAILED';
}

export type AdminPermissionRequestApprovalResult =
  | {
    status: 'APPROVED';
    request: AdminPermissionRequestRecord;
  }
  | {
    status: 'ACTIVE_ADMIN_EXISTS';
  }
  | {
    status: 'REQUEST_NOT_PENDING';
  };

export interface AdminPermissionRequestRepository {
  list(): Promise<AdminPermissionRequestRecord[]>;
  findPendingByEmail(email: string): Promise<AdminPermissionRequestRecord | undefined>;
  findById(requestId: number): Promise<AdminPermissionRequestRecord | undefined>;
  insert(input: { email: string; name: string; now: Date }): Promise<AdminPermissionRequestRecord>;
  approveAndProvisionAdmin(input: {
    requestId: number;
    actorAdminId: number;
    passwordHash: string;
    now: Date;
  }): Promise<AdminPermissionRequestApprovalResult>;
  markRejected(requestId: number, actorAdminId: number, reason: string, now: Date): Promise<AdminPermissionRequestRecord | undefined>;
  markCredentialDelivered(requestId: number, now: Date): Promise<void>;
  markCredentialDeliveryFailed(requestId: number, now: Date): Promise<void>;
}
