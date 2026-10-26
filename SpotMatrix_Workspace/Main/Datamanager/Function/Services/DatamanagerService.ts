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

// Hàm khởi tạo Thiết bị đầy đủ cho toàn bộ 25/25 phòng (Tầng 1-4: 24 phòng + Tầng 5: Hội trường H-01)
export function buildAllTwentyFiveRoomEquipments(): SharedEquipmentItem[] {
  const list: SharedEquipmentItem[] = [];
  const roomSpecs: Array<{
    suffix: string;
    primaryName: string;
    category: SharedEquipmentItem['categoryName'];
    posX: number;
    posY: number;
    secondaryName?: string;
    secondaryCat?: SharedEquipmentItem['categoryName'];
  }> = [
    {
      suffix: '01',
      primaryName: 'Màn hình Hội nghị 4K Samsung 75"',
      category: 'MONITOR_4K',
      posX: 150,
      posY: 115,
      secondaryName: 'Camera AI 360° Poly Studio E70',
      secondaryCat: 'AUDIO_POD',
    },
    {
      suffix: '02',
      primaryName: 'Máy chiếu Laser Epson 4K Pro',
      category: 'PROJECTOR',
      posX: 400,
      posY: 115,
    },
    {
      suffix: '03',
      primaryName: 'Hệ thống Âm thanh Hội trường Bose Videobar VB1',
      category: 'AUDIO_POD',
      posX: 650,
      posY: 115,
      secondaryName: 'Trạm Chia tín hiệu HDMI & Type-C 100W',
      secondaryCat: 'TYPE_C_HUB',
    },
    {
      suffix: '04',
      primaryName: 'Bảng Tương tác Cảm ứng KTS Wacom Cintiq 24"',
      category: 'WACOM_TABLET',
      posX: 150,
      posY: 345,
    },
    {
      suffix: '05',
      primaryName: 'Màn hình Cảm ứng Đa điểm LG One:Quick Works 55"',
      category: 'MONITOR_4K',
      posX: 400,
      posY: 345,
    },
    {
      suffix: '06',
      primaryName: 'Tổ hợp Micro Đa hướng & Camera PTZ 4K Logitech Rally',
      category: 'CONF_MIC_CAM',
      posX: 650,
      posY: 345,
    },
  ];

  let seq = 1;
  for (let floor = 1; floor <= 4; floor++) {
    roomSpecs.forEach((spec, idx) => {
      const roomCode = `M${floor}-${spec.suffix}`;
      const isInUse = floor === 1 && spec.suffix === '02';
      list.push({
        equipmentId: `EQ-${String(seq).padStart(2, '0')}`,
        equipmentCode: `EQ-M${floor}${spec.suffix}-DEV-01`,
        equipmentName: `${spec.primaryName} (${roomCode})`,
        categoryName: spec.category,
        status: isInUse ? 'IN_USE' : 'AVAILABLE',
        assignedNodeId: roomCode,
        position2D: { posX: spec.posX, posY: spec.posY },
        currentBookingId: isInUse ? 'BK-2026-001' : null,
        weeklyUsageHours: 16 + ((floor * 3 + idx * 4) % 18),
        monthlyUsageHours: 64 + ((floor * 12 + idx * 15) % 68),
        healthPercent: 92 + ((floor + idx) % 8),
      });
      seq += 1;

      if (floor === 1 && spec.secondaryName && spec.secondaryCat) {
        const isBroken = spec.suffix === '03';
        list.push({
          equipmentId: `EQ-${String(seq).padStart(2, '0')}`,
          equipmentCode: `EQ-M${floor}${spec.suffix}-DEV-02`,
          equipmentName: `${spec.secondaryName} (${roomCode})`,
          categoryName: spec.secondaryCat,
          status: isBroken ? 'BROKEN' : 'AVAILABLE',
          assignedNodeId: roomCode,
          position2D: { posX: spec.posX, posY: spec.posY },
          currentBookingId: null,
          weeklyUsageHours: 14,
          monthlyUsageHours: 58,
          healthPercent: isBroken ? 45 : 95,
        });
        seq += 1;
      }
    });
  }

  list.push(
    {
      equipmentId: `EQ-${String(seq).padStart(2, '0')}`,
      equipmentCode: 'EQ-H01-PANO-01',
      equipmentName: 'Màn hình LED Cong Panorama 360° Hội trường (H-01)',
      categoryName: 'PROJECTOR',
      status: 'AVAILABLE',
      assignedNodeId: 'H-01',
      position2D: { posX: 400, posY: 230 },
      currentBookingId: null,
      weeklyUsageHours: 28,
      monthlyUsageHours: 112,
      healthPercent: 99,
    },
    {
      equipmentId: `EQ-${String(seq + 1).padStart(2, '0')}`,
      equipmentCode: 'EQ-H01-AUDIO-02',
      equipmentName: 'Hệ thống Loa Line-Array & Micro Không dây Sân khấu (H-01)',
      categoryName: 'AUDIO_POD',
      status: 'AVAILABLE',
      assignedNodeId: 'H-01',
      position2D: { posX: 400, posY: 230 },
      currentBookingId: null,
      weeklyUsageHours: 26,
      monthlyUsageHours: 104,
      healthPercent: 98,
    }
  );

  return list;
}

const memoryEquipmentList: SharedEquipmentItem[] =
  buildAllTwentyFiveRoomEquipments();

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
    ipAddress: '113.161.72.104',
    locationLabel: 'TP. Hồ Chí Minh, VN',
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
    ipAddress: '127.0.0.1 (System Worker)',
    locationLabel: 'SpotMatrix Cloud Core',
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
    if (dbItems.length >= 25) return dbItems as unknown as SharedEquipmentItem[];
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
  ipAddress?: string;
  locationLabel?: string;
}): Promise<AuditConcurrencyLogItem> {
  const newLogEntry: AuditConcurrencyLogItem = {
    auditId: `AUD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    eventCategory: params.eventCategory,
    actorEmail: params.actorEmail,
    targetNodeId: params.targetNodeId,
    lockVersionAttempted: params.lockVersionAttempted,
    outcomeStatus: params.outcomeStatus,
    detailMessage: params.detailMessage,
    ipAddress: params.ipAddress || '113.161.72.104',
    locationLabel: params.locationLabel || 'TP. Hồ Chí Minh, VN',
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