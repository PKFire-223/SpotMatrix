export type WorkspaceZoneType = 'DESK_POD' | 'MEETING_ROOM' | 'FOCUS_BOOTH' | 'COLLAB_HUB';

export type SeatStatusType =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'RESERVED'
  | 'HOLDING'
  | 'MAINTENANCE';

export type UserRoleType = 'EMPLOYEE' | 'MANAGER' | 'SYS_ADMIN';

export type EquipmentStatusType = 'AVAILABLE' | 'IN_USE' | 'BROKEN';

export type RecurringOptionType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type AuditEventCategoryType =
  | 'OPTIMISTIC_LOCK_WIN'
  | 'OPTIMISTIC_LOCK_REJECTED'
  | 'AUTO_RELEASE_NO_SHOW'
  | 'QR_CHECKIN_SUCCESS'
  | 'FLOORPLAN_COORD_UPDATED'
  | 'POLICY_CONFIG_UPDATED';

export type NotificationCategoryType =
  | 'BOOKING_EVENT'
  | 'BOOKING_APPROVAL_REQUEST'
  | 'SECURITY_ALERT'
  | 'SYSTEM_POLICY'
  | 'FLOORPLAN_UPDATE';

export interface NotificationRecordItem {
  notificationId: string;
  recipientEmail: string;
  titleText: string;
  contentText: string;
  category: NotificationCategoryType;
  isRead: boolean;
  relatedNodeId?: string;
  approvalBookingId?: string;
  approvalHandledStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvalHandledBy?: string;
  createdAtIso: string;
}

export interface WorkspaceNodeItem {
  nodeId: string;
  nodeCode: string;
  nodeLabel: string;
  zoneType: WorkspaceZoneType;
  floorLevel: number;
  position2D: { posX: number; posY: number };
  position3D: { coordX: number; coordY: number; coordZ: number };
  capacityCount: number;
  status: SeatStatusType;
  amenitiesList: string[];
  aiScore?: number;
  lockVersion?: number;
  holdByEmail?: string | null;
  holdExpiresAtIso?: string | null;
}

export interface BookingPayloadItem {
  bookingId: string;
  nodeId: string;
  userEmail: string;
  requesterUsername?: string;
  requesterRole?: UserRoleType;
  departmentName?: string;
  bookingDateIso?: string;
  startTimeIso: string;
  endTimeIso: string;
  purposeNote: string;
  recurringOption?: RecurringOptionType;
  recurringSeriesId?: string | null;
  occurrenceDates?: string[];
  lockVersion?: number;
  holdExpiresAtIso?: string | null;
  noShowDeadlineIso?: string | null;
  autoReleasedReason?: string | null;
  bookingStatus: 'HOLDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED';
  approvalStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvedByUsername?: string | null;
  approvedAtIso?: string | null;
  checkedInAtIso?: string | null;
  bookingEquipmentIds?: string[];
}

export interface UserTrustProfileItem {
  userEmail: string;
  fullName: string;
  role: UserRoleType;
  departmentName: string;
  trustScore: number;
  onTimeCheckInCount: number;
  noShowPenaltyCount: number;
  isRestrictedMode: boolean;
  updatedAtIso: string;
}

export interface SharedEquipmentItem {
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  categoryName: 'PROJECTOR' | 'MONITOR_4K' | 'WACOM_TABLET' | 'TYPE_C_HUB' | 'AUDIO_POD';
  status: EquipmentStatusType;
  assignedNodeId: string | null;
  position2D: { posX: number; posY: number };
  currentBookingId: string | null;
  weeklyUsageHours?: number;
  monthlyUsageHours?: number;
  healthPercent?: number;
}

export interface SystemPolicyConfigItem {
  policyKey: string;
  holdTimeoutMinutes: number;
  checkinGracePeriodMinutes: number;
  maxMeetingHoursPerWeek: number;
  minTrustScoreForRecurring: number;
  restrictedMaxAdvanceDays: number;
  trustScoreCheckinReward: number;
  trustScoreNoshowPenalty: number;
  updatedByEmail: string;
  updatedAtIso: string;
}

export interface AuditConcurrencyLogItem {
  auditId: string;
  eventCategory: AuditEventCategoryType;
  actorEmail: string;
  targetNodeId: string;
  lockVersionAttempted?: number;
  outcomeStatus: 'SUCCESS' | 'CONFLICT_BLOCKED' | 'AUTO_REVOKED';
  detailMessage: string;
  createdAtIso: string;
}