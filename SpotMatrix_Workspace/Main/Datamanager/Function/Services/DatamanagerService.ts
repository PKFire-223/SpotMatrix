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

// ============================================================================
// KHO DU LIEU IN-MEMORY DU PHONG (Dam bao chay muot ngay ca khi chua bat Mongo)
// ============================================================================
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
    userEmail: 'employee.dev@spotmatrix.vn',
    fullName: 'Nguyễn Minh Quân (Backend Dev)',
    role: 'EMPLOYEE',
    departmentName: 'Platform Engineering',
    trustScore: 100,
    onTimeCheckInCount: 14,
    noShowPenaltyCount: 0,
    isRestrictedMode: false,
    updatedAtIso: new Date().toISOString(),
  },
  {
    userEmail: 'member.warning@spotmatrix.vn',
    fullName: 'Trần Hoàng Nam (UI Designer)',
    role: 'EMPLOYEE',
    departmentName: 'Product Design',
    trustScore: 55,
    onTimeCheckInCount: 3,
    noShowPenaltyCount: 5,
    isRestrictedMode: true,
    updatedAtIso: new Date().toISOString(),
  },
  {
    userEmail: 'manager.lead@spotmatrix.vn',
    fullName: 'Lê Thu Hà (Engineering Manager)',
    role: 'MANAGER',
    departmentName: 'Platform Engineering',
    trustScore: 100,
    onTimeCheckInCount: 28,
    noShowPenaltyCount: 0,
    isRestrictedMode: false,
    updatedAtIso: new Date().toISOString(),
  },
];

const memoryEquipmentList: SharedEquipmentItem[] = [
  {
    equipmentId: 'EQ-4K-01',
    equipmentCode: 'MON-4K-01',
    equipmentName: 'Màn hình phụ Dell UltraSharp 4K 27"',
    categoryName: 'MONITOR_4K',
    status: 'AVAILABLE',
    assignedNodeId: 'NODE-A01',
    position2D: { posX: 95, posY: 105 },
    currentBookingId: null,
  },
  {
    equipmentId: 'EQ-WACOM-02',
    equipmentCode: 'WAC-PRO-02',
    equipmentName: 'Bảng vẽ Wacom Cintiq Pro 16',
    categoryName: 'WACOM_TABLET',
    status: 'IN_USE',
    assignedNodeId: 'NODE-A02',
    position2D: { posX: 225, posY: 105 },
    currentBookingId: 'BK-2026-001',
  },
  {
    equipmentId: 'EQ-PROJ-03',
    equipmentCode: 'PRJ-LASER-03',
    equipmentName: 'Máy chiếu di động Sony Laser 4K',
    categoryName: 'PROJECTOR',
    status: 'AVAILABLE',
    assignedNodeId: 'NODE-M01',
    position2D: { posX: 375, posY: 125 },
    currentBookingId: null,
  },
  {
    equipmentId: 'EQ-HUB-04',
    equipmentCode: 'HUB-TB4-04',
    equipmentName: 'Bộ chuyển đổi Thunderbolt 4 Dock 12-in-1',
    categoryName: 'TYPE_C_HUB',
    status: 'BROKEN',
    assignedNodeId: 'NODE-C01',
    position2D: { posX: 310, posY: 255 },
    currentBookingId: null,
  },
];

const memoryAuditLogs: AuditConcurrencyLogItem[] = [
  {
    auditId: 'AUD-2026-9001',
    eventCategory: 'OPTIMISTIC_LOCK_REJECTED',
    actorEmail: 'member.warning@spotmatrix.vn',
    targetNodeId: 'NODE-A01',
    lockVersionAttempted: 1,
    outcomeStatus: 'CONFLICT_BLOCKED',
    detailMessage:
      'Tu choi giu cho do xung dot Optimistic Lock (Version 1 da bi user employee.dev@spotmatrix.vn chiem truoc 18ms).',
    createdAtIso: new Date().toISOString(),
  },
  {
    auditId: 'AUD-2026-9002',
    eventCategory: 'AUTO_RELEASE_NO_SHOW',
    actorEmail: 'SYSTEM_CRON_WORKER',
    targetNodeId: 'NODE-F01',
    outcomeStatus: 'AUTO_REVOKED',
    detailMessage:
      'Cronjob tu dong thu hoi ghe NODE-F01 sau 15 phut qua han Check-in QR va tru 10 diem tin nhiem.',
    createdAtIso: new Date().toISOString(),
  },
];

// ============================================================================
// MODULE 1: QUAN LY DIEM TIN NHIEM (RELIABILITY / TRUST SCORE)
// ============================================================================
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
  targetNodeId = 'NODE-A01'
): Promise<UserTrustProfileItem> {
  const policy = await getActivePolicyConfig();
  const deltaPoints =
    eventType === 'QR_CHECKIN_ONTIME'
      ? policy.trustScoreCheckinReward
      : -policy.trustScoreNoshowPenalty;

  let targetProfile = memoryTrustProfiles.find((item) => item.userEmail === userEmail);
  if (!targetProfile) {
    targetProfile = {
      userEmail,
      fullName: userEmail.split('@')[0],
      role: 'EMPLOYEE',
      departmentName: 'General Workspace',
      trustScore: envConfig.defaultInitialTrustScore,
      onTimeCheckInCount: 0,
      noShowPenaltyCount: 0,
      isRestrictedMode: false,
      updatedAtIso: new Date().toISOString(),
    };
    memoryTrustProfiles.push(targetProfile);
  }

  targetProfile.trustScore = Math.max(0, Math.min(120, targetProfile.trustScore + deltaPoints));
  if (eventType === 'QR_CHECKIN_ONTIME') {
    targetProfile.onTimeCheckInCount += 1;
  } else {
    targetProfile.noShowPenaltyCount += 1;
  }
  targetProfile.isRestrictedMode = targetProfile.trustScore < policy.minTrustScoreForRecurring;
  targetProfile.updatedAtIso = new Date().toISOString();

  if (getMongoConnectionState()) {
    await UserTrustProfileModel.findOneAndUpdate({ userEmail }, targetProfile, { upsert: true });
  }

  await recordAuditConcurrencyLog({
    eventCategory:
      eventType === 'QR_CHECKIN_ONTIME' ? 'QR_CHECKIN_SUCCESS' : 'AUTO_RELEASE_NO_SHOW',
    actorEmail: userEmail,
    targetNodeId,
    outcomeStatus: eventType === 'QR_CHECKIN_ONTIME' ? 'SUCCESS' : 'AUTO_REVOKED',
    detailMessage:
      eventType === 'QR_CHECKIN_ONTIME'
        ? `Check-in QR dung gio tai ${targetNodeId}: +${policy.trustScoreCheckinReward} diem (Tong: ${targetProfile.trustScore}).`
        : `Qua han ${policy.checkinGracePeriodMinutes} phut khong Check-in tai ${targetNodeId}: -${policy.trustScoreNoshowPenalty} diem (Con: ${targetProfile.trustScore}).`,
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
  const foundUser = profiles.find((u) => u.userEmail === userEmail);
  const currentScore = foundUser ? foundUser.trustScore : envConfig.defaultInitialTrustScore;

  if (currentScore < policy.minTrustScoreForRecurring) {
    if (isRecurringRequest) {
      return {
        allowed: false,
        trustScore: currentScore,
        restrictionReason: `Diem tin nhiem (${currentScore}) duoi muc toi thieu (${policy.minTrustScoreForRecurring}). He thong tam khoa quyen dat lich dinh ky hang tuan/thang.`,
      };
    }
    if (requestedAdvanceDays > policy.restrictedMaxAdvanceDays) {
      return {
        allowed: false,
        trustScore: currentScore,
        restrictionReason: `Diem tin nhiem (${currentScore} < ${policy.minTrustScoreForRecurring}) chi cho phep giu cho truoc toi da ${policy.restrictedMaxAdvanceDays} ngay.`,
      };
    }
  }

  return {
    allowed: true,
    trustScore: currentScore,
    restrictionReason: null,
  };
}

// ============================================================================
// MODULE 2: QUAN LY DANH MUC THIET BI DUNG CHUNG GAN TOA DO (EQUIPMENT)
// ============================================================================
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
  const targetEq = memoryEquipmentList.find((item) => item.equipmentId === equipmentId);
  if (targetEq) {
    targetEq.status = nextStatus;
    targetEq.currentBookingId = bookingId;
    if (assignedNodeId !== undefined) {
      targetEq.assignedNodeId = assignedNodeId;
    }
  }
  if (getMongoConnectionState() && targetEq) {
    await SharedEquipmentModel.findOneAndUpdate({ equipmentId }, targetEq, { upsert: true });
  }
  return targetEq || null;
}

// ============================================================================
// MODULE 3: QUAN LY CHINH SACH & HAN MUC DAT CHO DONG (POLICY & QUOTA)
// ============================================================================
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
    detailMessage: `Admin cap nhat chinh sach: Hold=${memoryPolicyConfig.holdTimeoutMinutes}p, GraceCheckIn=${memoryPolicyConfig.checkinGracePeriodMinutes}p, MinTrust=${memoryPolicyConfig.minTrustScoreForRecurring}.`,
  });

  return memoryPolicyConfig;
}

// ============================================================================
// MODULE 4: NHAT KY XUNG DOT & TRUY VET (CONCURRENCY & AUDIT LOGS)
// ============================================================================
export async function listAuditConcurrencyLogs(): Promise<AuditConcurrencyLogItem[]> {
  if (getMongoConnectionState()) {
    const logs = await AuditConcurrencyLogModel.find().sort({ createdAt: -1 }).limit(50).lean();
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

export function calculateZoneOccupancyRate(occupiedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  return Math.round((occupiedCount / totalCount) * 100);
}
