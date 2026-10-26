export type SeatStatusType =
  | 'AVAILABLE'
  | 'HOLDING'
  | 'RESERVED'
  | 'OCCUPIED'
  | 'MAINTENANCE';

export type WorkspaceZoneType =
  | 'MEETING_ROOM'
  | 'COLLAB_HUB'
  | 'QUIET_POD'
  | 'DESK_POD'
  | 'FOCUS_BOOTH'
  | 'AMPHITHEATER_HALL';

export type UserRoleType = 'EMPLOYEE' | 'MANAGER' | 'SYS_ADMIN';

export type RecurringOptionType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type HallBookingModeType =
  | 'STANDARD_ROOM'
  | 'HALL_EVENT_RENTAL'
  | 'HALL_SEAT_BOOKING';

export type WebLanguageCodeType = 'vi' | 'en' | 'ja';

export interface WorkspaceNodeItem {
  nodeId: string;
  nodeCode: string;
  nodeLabel: string;
  zoneType: WorkspaceZoneType;
  floorLevel: number;
  position2D: {
    posX: number;
    posY: number;
  };
  position3D: {
    coordX: number;
    coordY: number;
    coordZ: number;
  };
  capacityCount: number;
  status: SeatStatusType;
  amenitiesList: string[];
  aiScore?: number;
  lockVersion?: number;
  heldByEmail?: string | null;
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
  bookingStatus:
    | 'HOLDING'
    | 'CONFIRMED'
    | 'CHECKED_IN'
    | 'AUTO_RELEASED'
    | 'CANCELLED';
  approvalStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvedByUsername?: string | null;
  approvedAtIso?: string | null;
  checkedInAtIso?: string | null;
  attachedEquipmentIds?: string[];
  bookingMode?: HallBookingModeType;
  allowedDepartments?: string[];
  parentHallEventBookingId?: string | null;
}

export type NotificationCategoryType =
  | 'BOOKING_EVENT'
  | 'BOOKING_APPROVAL_REQUEST'
  | 'FLOORPLAN_UPDATE'
  | 'AI_SUGGESTION'
  | 'SYSTEM_POLICY'
  | 'TRUST_SCORE_ALERT';

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

export type EquipmentStatusType = 'AVAILABLE' | 'IN_USE' | 'BROKEN';

export interface SharedEquipmentItem {
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  categoryName:
    | 'PROJECTOR'
    | 'MONITOR_4K'
    | 'WACOM_TABLET'
    | 'TYPE_C_HUB'
    | 'AUDIO_POD'
    | 'CONF_MIC_CAM';
  status: EquipmentStatusType;
  assignedNodeId: string | null;
  position2D: {
    posX: number;
    posY: number;
  };
  currentBookingId: string | null;
  weeklyUsageHours?: number;
  monthlyUsageHours?: number;
  healthPercent?: number;
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

export type AuditEventCategoryType =
  | 'OPTIMISTIC_LOCK_WIN'
  | 'OPTIMISTIC_LOCK_REJECTED'
  | 'AUTO_RELEASE_NO_SHOW'
  | 'QR_CHECKIN_SUCCESS'
  | 'FLOORPLAN_COORD_UPDATED'
  | 'POLICY_CONFIG_UPDATED'
  | 'USER_LOGIN_SESSION';

export interface AuditConcurrencyLogItem {
  auditId: string;
  eventCategory: AuditEventCategoryType;
  actorEmail: string;
  targetNodeId: string;
  lockVersionAttempted?: number;
  outcomeStatus: 'SUCCESS' | 'CONFLICT_BLOCKED' | 'AUTO_REVOKED';
  detailMessage: string;
  ipAddress?: string;
  locationLabel?: string;
  deviceAgent?: string;
  createdAtIso: string;
}

// ============================================================================
// CẤU TRÚC TỔ CHỨC: PHÒNG BAN (1 NGƯỜI CHỈ 1 PHÒNG BAN) & NHÓM CON TRỰC THUỘC
// ============================================================================

export interface OrganizationDepartmentItem {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  description: string;
  managerEmail: string;
  managerName: string;
  floorLocation: string;
  colorBadge: 'INDIGO' | 'TEAL' | 'AMBER' | 'ROSE';
  memberEmails: string[];
  updatedAtIso: string;
}

export interface OrganizationGroupItem {
  groupId: string;
  groupCode: string;
  groupName: string;
  departmentName: string;
  description: string;
  leaderEmail: string;
  leaderName: string;
  projectTag: string;
  memberEmails: string[];
  updatedAtIso: string;
}

// ============================================================================
// NHẬT KÝ ĐĂNG NHẬP IP & CÀI ĐẶT BỀN VỮNG TOÀN HỆ THỐNG
// ============================================================================

export interface LoginIpRecordItem {
  logId: string;
  username: string;
  userEmail: string;
  ipAddress: string;
  locationText: string;
  deviceText: string;
  loginAtIso: string;
  isCurrentSession: boolean;
}

export interface SpotMatrixPersistedPreferences {
  webLanguage: WebLanguageCodeType;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
  ttsRate: number;
  twoFactorEnabled: boolean;
  sessionTimeoutMins: number;
  activeSettingsTab:
    | 'SOUND_THEME'
    | 'SECURITY_PASSWORD'
    | 'LANGUAGE_LOCALE'
    | 'DEPARTMENT_POLICY';
}