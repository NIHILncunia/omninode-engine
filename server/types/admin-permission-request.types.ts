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

export interface AdminPermissionRequestRepository {
  list(): Promise<AdminPermissionRequestRecord[]>;
  findPendingByEmail(email: string): Promise<AdminPermissionRequestRecord | undefined>;
  findById(requestId: number): Promise<AdminPermissionRequestRecord | undefined>;
  insert(input: { email: string; name: string; now: Date }): Promise<AdminPermissionRequestRecord>;
  markApproved(requestId: number, actorAdminId: number, now: Date): Promise<AdminPermissionRequestRecord | undefined>;
  markRejected(requestId: number, actorAdminId: number, reason: string, now: Date): Promise<AdminPermissionRequestRecord | undefined>;
  markCredentialDelivered(requestId: number, now: Date): Promise<void>;
  markCredentialDeliveryFailed(requestId: number, now: Date): Promise<void>;
}
