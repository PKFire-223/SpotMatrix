import { loadSystemEnvConfig } from '../../../../Shared/Config/EnvConfig';
import { getMongoConnectionState } from '../../../../Shared/Database/MongoConnection';
import {
  AuditConcurrencyLogItem,
  AuditEventCategoryType,
  EquipmentStatusType,
  SharedEquipmentItem,
  SystemPolicyConfigItem,
  UserTrustProfileItem,
} from '../../../../Shared/Types/GlobalSystemTypes';
import {
  AuditConcurrencyLogModel,
  SharedEquipmentModel,
  SystemPolicyConfigModel,
  UserTrustProfileModel,
} from '../Models/DatasetRecordModel';

const envConfig = loadSystemEnvConfig();

let memoryPolicyConfig: SystemPolicyConfigItem = {
  policyKey: 'GLOBAL_WORKSPACE_POLICY',
  holdTimeoutMinutes: envConfig.holdTimeoutMinutes,
  checkinGracePeriodMinutes: envConfig.checkinGracePeriodMinutes,
  maxMeetingHoursPerWeek: envConfig.maxMeetingHoursPerWeek,
  minTrustScoreForRecurring: envConfig.minTrustScoreForRecurring,
  restrictedMaxAdvanceDays: envConfig.restrictedMaxAdvanceDays,
  trustScoreCheckinReward: envConfig.trustScoreCheckinReward,
  trustScoreNoshowPenalty: envConfig.trustScoreNoshowPenalty,
  updatedByEmail: 'sysadmin@spotmatrix.vn',
  updatedAtIso: new Date().toISOString(),
};

const memoryTrustProfiles: UserTrustProfileItem[] = [
  {
    userEmail: 'sysadmin@spotmatrix.vn',
    fullName: 'System Administrator',
    role: 'SYS_ADMIN',
    departmentName: 'System Governance',
    trustScore: 100,
    onTimeCheckInCount: 32,
    noShowPenaltyCount: 0,
    isRestrictedMode: false,
    updatedAtIso: new Date().toISOString(),
  },
  {
    userEmail: 'manager.lead@spotmatrix.vn',
    fullName: 'Lê Thu Hà (Quản lý)',
    role: 'MANAGER',
    departmentName: 'Product & Engineering',
    trustScore: 100,
    onTimeCheckInCount: 28,
    noShowPenaltyCount: 0,
    isRestrictedMode: false,
    updatedAtIso: new Date().toISOString(),
  },
  {
    userEmail: 'employee.dev@spotmatrix.vn',
    fullName: 'Nguyễn Minh Quân (Nhân viên)',
    role: 'EMPLOYEE',
    departmentName: 'Product & Engineering',
    trustScore: 96,
    onTimeCheckInCount: 18,
    noShowPenaltyCount: 1,
    isRestrictedMode: false,
    updatedAtIso: new Date().toISOString(),
  },
];

const memoryEquipmentList: SharedEquipmentItem[] = [
  {
    equipmentId: 'EQ-01',
    equipmentCode: 'EQ-M101-SCREEN-01',
    equipmentName: 'Màn hình Hội nghị 4K Samsung 75"',
    categoryName: 'PROJECTOR',
    status: 'AVAILABLE',
    assignedNodeId: 'M1-01',
    position2D: { posX: 150, posY: 115 },
    currentBookingId: null,
    weeklyUsageHours: 24,
    monthlyUsageHours: 96,
    healthPercent: 98,
  },
  {
    equipmentId: 'EQ-02',
    equipmentCode: 'EQ-M101-CAM-02',
    equipmentName: 'Camera AI 360° Poly Studio E70',
    categoryName: 'AUDIO_POD',
    status: 'AVAILABLE',
    assignedNodeId: 'M1-01',
    position2D: { posX: 150, posY: 115 },
    currentBookingId: null,
    weeklyUsageHours: 18,
    monthlyUsageHours: 72,
    healthPercent: 94,
  },
  {
    equipmentId: 'EQ-03',
    equipmentCode: 'EQ-M102-LASER-01',
    equipmentName: 'Máy chiếu Laser Epson 4K Pro',
    categoryName: 'PROJECTOR',
    status: 'IN_USE',
    assignedNodeId: 'M1-02',
    position2D: { posX: 400, posY: 115 },
    currentBookingId: 'BK-2026-001',
    weeklyUsageHours: 31,
    monthlyUsageHours: 124,
    healthPercent: 86,
  },
  {
    equipmentId: 'EQ-04',
    equipmentCode: 'EQ-M103-HUB-01',
    equipmentName: 'Trạm Chia tín hiệu HDMI & Type-C 100W',
    categoryName: 'TYPE_C_HUB',
    status: 'BROKEN',
    assignedNodeId: 'M1-03',
    position2D: { posX: 650, posY: 115 },
    currentBookingId: null,
    weeklyUsageHours: 12,
    monthlyUsageHours: 54,
    healthPercent: 45,
  },
  {
    equipmentId: 'EQ-05',
    equipmentCode: 'EQ-M205-WACOM-01',
    equipmentName: 'Bảng Tương tác Cảm ứng KTS Wacom 24"',
    categoryName: 'WACOM_TABLET',
    status: 'AVAILABLE',
    assignedNodeId: 'M2-05',
    position2D: { posX: 400, posY: 345 },
    currentBookingId: null,
    weeklyUsageHours: 19,
    monthlyUsageHours: 78,
    healthPercent: 95,
  },
  {
    equipmentId: 'EQ-06',
    equipmentCode: 'EQ-H01-PANO-01',
    equipmentName: 'Màn hình LED Cong Panorama 360° Hội trường',
    categoryName: 'PROJECTOR',
    status: 'AVAILABLE',
    assignedNodeId: 'H-01',
    position2D: { posX: 400, posY: 230 },
    currentBookingId: null,
    weeklyUsageHours: 28,
    monthlyUsageHours: 112,
    healthPercent: 99,
  },
];

const memoryAuditLogs: AuditConcurrencyLogItem[] = [
  {
    auditId: 'AUD-2026-9001',
    eventCategory: 'OPTIMISTIC_LOCK_REJECTED',
    actorEmail: 'employee.dev@spotmatrix.vn',
    targetNodeId: 'M1-01',
    lockVersionAttempted: 1,
    outcomeStatus: 'CONFLICT_BLOCKED',
    detailMessage:
      'Từ chối giữ chỗ do xung đột Optimistic Lock (Version 1 đã được nâng lên Version 2 trước 18ms).',
    createdAtIso: new Date().toISOString(),
  },
  {
    auditId: 'AUD-2026-9002',
    eventCategory: 'AUTO_RELEASE_NO_SHOW',
    actorEmail: 'SYSTEM_CRON_WORKER',
    targetNodeId: 'M2-03',
    outcomeStatus: 'AUTO_REVOKED',
    detailMessage:
      'Cronjob tự động thu hồi phòng M2-03 sau 15 phút quá hạn Check-in QR và trừ 10 điểm tín nhiệm.',
    createdAtIso: new Date().toISOString(),
  },
];

export function syncMemoryTrustProfileDepartment(
  cleanEmail: string,
  targetDepartmentName: string
): void {
  const memProfile = memoryTrustProfiles.find(
    (p) => p.userEmail.toLowerCase() === cleanEmail.toLowerCase()
  );
  if (memProfile) {
    memProfile.departmentName = targetDepartmentName;
  }
}

export async function listUserTrustProfiles(): Promise<UserTrustProfileItem[]> {
  if (getMongoConnectionState()) {
    const docs = await UserTrustProfileModel.find().lean();
    if (docs.length > 0) return docs as unknown as UserTrustProfileItem[];
  }
  return memoryTrustProfiles;
}

export async function adjustUserTrustScore(
  userEmail: string,
  eventType: 'QR_CHECKIN_ONTIME' | 'NO_SHOW_EXPIRED',
  targetNodeId = 'M1-01'
): Promise<UserTrustProfileItem> {
  const policy = await getActivePolicyConfig();
  const deltaPoints =
    eventType === 'QR_CHECKIN_ONTIME'
      ? policy.trustScoreCheckinReward
      : -policy.trustScoreNoshowPenalty;

  let targetProfile = memoryTrustProfiles.find(
    (item) => item.userEmail.toLowerCase() === userEmail.toLowerCase()
  );
  if (!targetProfile) {
    targetProfile = {
      userEmail,
      fullName: userEmail.split('@')[0],
      role: 'EMPLOYEE',
      departmentName: 'Product & Engineering',
      trustScore: envConfig.defaultInitialTrustScore,
      onTimeCheckInCount: 0,
      noShowPenaltyCount: 0,
      isRestrictedMode: false,
      updatedAtIso: new Date().toISOString(),
    };
    memoryTrustProfiles.push(targetProfile);
  }

  targetProfile.trustScore = Math.max(
    0,
    Math.min(100, targetProfile.trustScore + deltaPoints)
  );
  if (eventType === 'QR_CHECKIN_ONTIME') {
    targetProfile.onTimeCheckInCount += 1;
  } else {
    targetProfile.noShowPenaltyCount += 1;
  }
  targetProfile.isRestrictedMode =
    targetProfile.trustScore < policy.minTrustScoreForRecurring;
  targetProfile.updatedAtIso = new Date().toISOString();

  if (getMongoConnectionState()) {
    await UserTrustProfileModel.findOneAndUpdate({ userEmail }, targetProfile, {
      upsert: true,
    });
  }

  await recordAuditConcurrencyLog({
    eventCategory:
      eventType === 'QR_CHECKIN_ONTIME'
        ? 'QR_CHECKIN_SUCCESS'
        : 'AUTO_RELEASE_NO_SHOW',
    actorEmail: userEmail,
    targetNodeId,
    outcomeStatus:
      eventType === 'QR_CHECKIN_ONTIME' ? 'SUCCESS' : 'AUTO_REVOKED',
    detailMessage:
      eventType === 'QR_CHECKIN_ONTIME'
        ? `Check-in QR đúng giờ tại ${targetNodeId}: +${policy.trustScoreCheckinReward} điểm (Tổng: ${targetProfile.trustScore}).`
        : `Quá hạn ${policy.checkinGracePeriodMinutes} phút không Check-in tại ${targetNodeId}: -${policy.trustScoreNoshowPenalty} điểm (Còn: ${targetProfile.trustScore}).`,
  });

  return targetProfile;
}

export async function evaluateUserBookingEligibility(
  userEmail: string,
  isRecurringRequest: boolean,
  requestedAdvanceDays: number
): Promise<{
  allowed: boolean;
  trustScore: number;
  restrictionReason: string | null;
}> {
  const policy = await getActivePolicyConfig();
  const profiles = await listUserTrustProfiles();
  const foundUser = profiles.find(
    (u) => u.userEmail.toLowerCase() === userEmail.toLowerCase()
  );
  const currentScore = foundUser
    ? foundUser.trustScore
    : envConfig.defaultInitialTrustScore;

  if (currentScore < policy.minTrustScoreForRecurring) {
    if (isRecurringRequest) {
      return {
        allowed: false,
        trustScore: currentScore,
        restrictionReason: `Điểm tín nhiệm (${currentScore}) dưới mức tối thiểu (${policy.minTrustScoreForRecurring}). Hệ thống tạm khóa quyền đặt lịch định kỳ.`,
      };
    }
    if (requestedAdvanceDays > policy.restrictedMaxAdvanceDays) {
      return {
        allowed: false,
        trustScore: currentScore,
        restrictionReason: `Điểm tín nhiệm (${currentScore} < ${policy.minTrustScoreForRecurring}) chỉ cho phép giữ chỗ trước tối đa ${policy.restrictedMaxAdvanceDays} ngày.`,
      };
    }
  }

  return {
    allowed: true,
    trustScore: currentScore,
    restrictionReason: null,
  };
}

export async function listSharedEquipments(
  statusFilter?: EquipmentStatusType
): Promise<SharedEquipmentItem[]> {
  if (getMongoConnectionState()) {
    const query = statusFilter ? { status: statusFilter } : {};
    const dbItems = await SharedEquipmentModel.find(query).lean();
    if (dbItems.length > 0) return dbItems as unknown as SharedEquipmentItem[];
  }
  if (statusFilter) {
    return memoryEquipmentList.filter((item) => item.status === statusFilter);
  }
  return memoryEquipmentList;
}

export async function updateEquipmentAttachmentStatus(
  equipmentId: string,
  nextStatus: EquipmentStatusType,
  bookingId: string | null = null,
  assignedNodeId?: string
): Promise<SharedEquipmentItem | null> {
  const targetEq = memoryEquipmentList.find(
    (item) => item.equipmentId === equipmentId
  );
  if (targetEq) {
    targetEq.status = nextStatus;
    targetEq.currentBookingId = bookingId;
    if (assignedNodeId !== undefined) {
      targetEq.assignedNodeId = assignedNodeId;
    }
  }
  if (getMongoConnectionState() && targetEq) {
    await SharedEquipmentModel.findOneAndUpdate({ equipmentId }, targetEq, {
      upsert: true,
    });
  }
  return targetEq || null;
}

export async function getActivePolicyConfig(): Promise<SystemPolicyConfigItem> {
  if (getMongoConnectionState()) {
    const dbPolicy = await SystemPolicyConfigModel.findOne({
      policyKey: 'GLOBAL_WORKSPACE_POLICY',
    }).lean();
    if (dbPolicy) return dbPolicy as unknown as SystemPolicyConfigItem;
  }
  return memoryPolicyConfig;
}

export async function updateActivePolicyConfig(
  partialUpdate: Partial<SystemPolicyConfigItem>,
  adminEmail = 'sysadmin@spotmatrix.vn'
): Promise<SystemPolicyConfigItem> {
  memoryPolicyConfig = {
    ...memoryPolicyConfig,
    ...partialUpdate,
    updatedByEmail: adminEmail,
    updatedAtIso: new Date().toISOString(),
  };

  if (getMongoConnectionState()) {
    await SystemPolicyConfigModel.findOneAndUpdate(
      { policyKey: 'GLOBAL_WORKSPACE_POLICY' },
      memoryPolicyConfig,
      { upsert: true }
    );
  }

  await recordAuditConcurrencyLog({
    eventCategory: 'POLICY_CONFIG_UPDATED',
    actorEmail: adminEmail,
    targetNodeId: 'GLOBAL_POLICY',
    outcomeStatus: 'SUCCESS',
    detailMessage: `Admin cập nhật chính sách: Hold=${memoryPolicyConfig.holdTimeoutMinutes}p, GraceCheckIn=${memoryPolicyConfig.checkinGracePeriodMinutes}p, MinTrust=${memoryPolicyConfig.minTrustScoreForRecurring}.`,
  });

  return memoryPolicyConfig;
}

export async function listAuditConcurrencyLogs(): Promise<
  AuditConcurrencyLogItem[]
> {
  if (getMongoConnectionState()) {
    const logs = await AuditConcurrencyLogModel.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    if (logs.length > 0) return logs as unknown as AuditConcurrencyLogItem[];
  }
  return memoryAuditLogs;
}

export async function recordAuditConcurrencyLog(params: {
  eventCategory: AuditEventCategoryType;
  actorEmail: string;
  targetNodeId: string;
  lockVersionAttempted?: number;
  outcomeStatus: 'SUCCESS' | 'CONFLICT_BLOCKED' | 'AUTO_REVOKED';
  detailMessage: string;
}): Promise<AuditConcurrencyLogItem> {
  const newLogEntry: AuditConcurrencyLogItem = {
    auditId: `AUD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    eventCategory: params.eventCategory,
    actorEmail: params.actorEmail,
    targetNodeId: params.targetNodeId,
    lockVersionAttempted: params.lockVersionAttempted,
    outcomeStatus: params.outcomeStatus,
    detailMessage: params.detailMessage,
    createdAtIso: new Date().toISOString(),
  };

  memoryAuditLogs.unshift(newLogEntry);
  if (getMongoConnectionState()) {
    await AuditConcurrencyLogModel.create(newLogEntry);
  }
  return newLogEntry;
}

export function calculateZoneOccupancyRate(
  occupiedCount: number,
  totalCount: number
): number {
  if (totalCount <= 0) return 0;
  return Math.round((occupiedCount / totalCount) * 100);
}