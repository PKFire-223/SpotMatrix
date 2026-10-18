export type WorkspaceZoneType = 'DESK_POD' | 'MEETING_ROOM' | 'FOCUS_BOOTH' | 'COLLAB_HUB';

export type SeatStatusType = 'AVAILABLE' | 'HOLDING' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export type UserRoleType = 'EMPLOYEE' | 'MANAGER' | 'SYS_ADMIN';

export type EquipmentStatusType = 'AVAILABLE' | 'IN_USE' | 'BROKEN';

export type AuditEventCategoryType =
  | 'OPTIMISTIC_LOCK_WIN'
  | 'OPTIMISTIC_LOCK_REJECTED'
  | 'AUTO_RELEASE_NO_SHOW'
  | 'QR_CHECKIN_SUCCESS'
  | 'FLOORPLAN_COORD_UPDATED'
  | 'POLICY_CONFIG_UPDATED';

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
}

export interface BookingPayloadItem {
  bookingId: string;
  nodeId: string;
  userEmail: string;
  startTimeIso: string;
  endTimeIso: string;
  purposeNote: string;
  bookingStatus: 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED';
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