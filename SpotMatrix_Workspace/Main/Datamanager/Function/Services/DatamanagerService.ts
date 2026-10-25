import { loadSystemEnvConfig } from '../../../../Shared/Config/EnvConfig';
import { getMongoConnectionState } from '../../../../Shared/Database/MongoConnection';
import {
  AuditConcurrencyLogItem,
  AuditEventCategoryType,
  EquipmentStatusType,
  OrganizationDepartmentItem,
  OrganizationGroupItem,
  SharedEquipmentItem,
  SystemPolicyConfigItem,
  UserTrustProfileItem,
} from '../../../../Shared/Types/GlobalSystemTypes';
import {
  AuditConcurrencyLogModel,
  OrganizationDepartmentModel,
  OrganizationGroupModel,
  SharedEquipmentModel,
  SystemPolicyConfigModel,
  UserTrustProfileModel,
} from '../Models/DatasetRecordModel';
import { UserAccountModel } from '../../../Auth/Function/Models/UserAccountModel';

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

let memoryDepartments: OrganizationDepartmentItem[] = [
  {
    departmentId: 'DEPT-GOV-01',
    departmentCode: 'SYS-GOV',
    departmentName: 'System Governance',
    description:
      'Ban Quản trị Hệ thống, An ninh Mạng RBAC & Điều phối Tòa nhà 5 Tầng',
    managerEmail: 'sysadmin@spotmatrix.vn',
    managerName: 'System Administrator',
    floorLocation: 'Tầng 1 & Tầng 5 (Hội trường)',
    colorBadge: 'INDIGO',
    memberEmails: ['sysadmin@spotmatrix.vn'],
    updatedAtIso: new Date().toISOString(),
  },
  {
    departmentId: 'DEPT-ENG-02',
    departmentCode: 'PROD-ENG',
    departmentName: 'Product & Engineering',
    description:
      'Khối Kỹ thuật Phần mềm, Kiến trúc Không gian 3D Three.js & Nền tảng Cloud',
    managerEmail: 'manager.lead@spotmatrix.vn',
    managerName: 'Lê Thu Hà (Quản lý)',
    floorLocation: 'Tầng 2 & Tầng 3',
    colorBadge: 'TEAL',
    memberEmails: ['manager.lead@spotmatrix.vn', 'employee.dev@spotmatrix.vn'],
    updatedAtIso: new Date().toISOString(),
  },
  {
    departmentId: 'DEPT-DES-03',
    departmentCode: 'UX-DESIGN',
    departmentName: 'Product Design & UX',
    description:
      'Khối Thiết kế Trải nghiệm Không gian Số, Bản vẽ Mặt bằng 2D/3D & Đồ họa',
    managerEmail: 'manager.lead@spotmatrix.vn',
    managerName: 'Lê Thu Hà (Quản lý)',
    floorLocation: 'Tầng 3',
    colorBadge: 'AMBER',
    memberEmails: [],
    updatedAtIso: new Date().toISOString(),
  },
  {
    departmentId: 'DEPT-AI-04',
    departmentCode: 'AI-DATA',
    departmentName: 'AI & Data Science',
    description:
      'Khối Trí tuệ Nhân tạo, Phân tích Mật độ Sử dụng Phòng họp & Tối ưu Công suất',
    managerEmail: 'sysadmin@spotmatrix.vn',
    managerName: 'System Administrator',
    floorLocation: 'Tầng 4',
    colorBadge: 'ROSE',
    memberEmails: [],
    updatedAtIso: new Date().toISOString(),
  },
];

let memoryGroups: OrganizationGroupItem[] = [
  {
    groupId: 'GRP-3D-01',
    groupCode: 'SQUAD-3D-TWIN',
    groupName: 'Nhóm Kiến trúc Sơ đồ 3D & Spatial Twin',
    departmentName: 'Product & Engineering',
    description:
      'Phát triển mô hình 3D Three.js 5 tầng và Đấu trường La Mã Tầng 5',
    leaderEmail: 'manager.lead@spotmatrix.vn',
    leaderName: 'Lê Thu Hà (Quản lý)',
    projectTag: '3D Engine v5.0',
    memberEmails: [
      'sysadmin@spotmatrix.vn',
      'manager.lead@spotmatrix.vn',
      'employee.dev@spotmatrix.vn',
    ],
    updatedAtIso: new Date().toISOString(),
  },
  {
    groupId: 'GRP-CORE-02',
    groupCode: 'SQUAD-CORE-API',
    groupName: 'Nhóm Core Backend, Optimistic Lock & MongoDB',
    departmentName: 'Product & Engineering',
    description:
      'Vận hành cơ chế giữ chỗ 5 phút, chống trùng lịch đa chiều và Cronjob 15p',
    leaderEmail: 'manager.lead@spotmatrix.vn',
    leaderName: 'Lê Thu Hà (Quản lý)',
    projectTag: 'Concurrency Lock',
    memberEmails: ['manager.lead@spotmatrix.vn', 'employee.dev@spotmatrix.vn'],
    updatedAtIso: new Date().toISOString(),
  },
  {
    groupId: 'GRP-SEC-03',
    groupCode: 'SQUAD-SEC-RBAC',
    groupName: 'Hội đồng Bảo mật RBAC & Kiểm toán Hệ thống',
    departmentName: 'System Governance',
    description:
      'Giám sát nhật ký truy vết, phê duyệt thuê Hội trường và quản lý điểm tín nhiệm',
    leaderEmail: 'sysadmin@spotmatrix.vn',
    leaderName: 'System Administrator',
    projectTag: 'Zero-Trust Audit',
    memberEmails: ['sysadmin@spotmatrix.vn', 'manager.lead@spotmatrix.vn'],
    updatedAtIso: new Date().toISOString(),
  },
];

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

// ============================================================================
// MODULE 5: QUẢN LÝ TỔ CHỨC — PHÒNG BAN (1 NGƯỜI 1 PHÒNG BAN) & NHÓM (1 NGƯỜI NHIỀU NHÓM)
// ============================================================================
export async function listOrganizationStructure(): Promise<{
  departments: OrganizationDepartmentItem[];
  groups: OrganizationGroupItem[];
}> {
  if (getMongoConnectionState()) {
    const deptCount = await OrganizationDepartmentModel.countDocuments();
    if (deptCount === 0) {
      await OrganizationDepartmentModel.insertMany(memoryDepartments);
    }
    const grpCount = await OrganizationGroupModel.countDocuments();
    if (grpCount === 0) {
      await OrganizationGroupModel.insertMany(memoryGroups);
    }

    const [dbDepts, dbGroups] = await Promise.all([
      OrganizationDepartmentModel.find().sort({ createdAt: 1 }).lean(),
      OrganizationGroupModel.find().sort({ createdAt: 1 }).lean(),
    ]);

    memoryDepartments = dbDepts as unknown as OrganizationDepartmentItem[];
    memoryGroups = dbGroups as unknown as OrganizationGroupItem[];
  }

  return {
    departments: memoryDepartments,
    groups: memoryGroups,
  };
}

export async function upsertOrganizationDepartment(
  payload: OrganizationDepartmentItem
): Promise<OrganizationDepartmentItem> {
  const normalized: OrganizationDepartmentItem = {
    ...payload,
    updatedAtIso: new Date().toISOString(),
  };

  const existingIdx = memoryDepartments.findIndex(
    (d) => d.departmentId === normalized.departmentId
  );
  if (existingIdx >= 0) {
    memoryDepartments[existingIdx] = normalized;
  } else {
    memoryDepartments.push(normalized);
  }

  if (getMongoConnectionState()) {
    await OrganizationDepartmentModel.findOneAndUpdate(
      { departmentId: normalized.departmentId },
      { $set: normalized },
      { upsert: true, new: true }
    );
  }

  return normalized;
}

export async function deleteOrganizationDepartment(
  departmentId: string
): Promise<boolean> {
  memoryDepartments = memoryDepartments.filter(
    (d) => d.departmentId !== departmentId
  );
  if (getMongoConnectionState()) {
    await OrganizationDepartmentModel.deleteOne({ departmentId });
  }
  return true;
}

// Quy tắc: Một người CHỈ thuộc duy nhất 1 Phòng ban
export async function assignUserToSingleDepartment(
  userEmail: string,
  targetDepartmentName: string
): Promise<{
  departments: OrganizationDepartmentItem[];
  updatedDepartmentName: string;
}> {
  const cleanEmail = userEmail.trim().toLowerCase();

  memoryDepartments = memoryDepartments.map((dept) => {
    const filteredMembers = (dept.memberEmails || []).filter(
      (em) => em.trim().toLowerCase() !== cleanEmail
    );
    const isTarget =
      dept.departmentName.trim().toLowerCase() ===
      targetDepartmentName.trim().toLowerCase();
    return {
      ...dept,
      memberEmails: isTarget
        ? [...filteredMembers, userEmail]
        : filteredMembers,
      updatedAtIso: new Date().toISOString(),
    };
  });

  const memProfile = memoryTrustProfiles.find(
    (p) => p.userEmail.toLowerCase() === cleanEmail
  );
  if (memProfile) {
    memProfile.departmentName = targetDepartmentName;
  }

  if (getMongoConnectionState()) {
    for (const dept of memoryDepartments) {
      await OrganizationDepartmentModel.findOneAndUpdate(
        { departmentId: dept.departmentId },
        {
          $set: {
            memberEmails: dept.memberEmails,
            updatedAtIso: dept.updatedAtIso,
          },
        }
      );
    }
    await UserTrustProfileModel.updateMany(
      { userEmail: new RegExp(`^${cleanEmail}$`, 'i') },
      { $set: { departmentName: targetDepartmentName } }
    );
    await UserAccountModel.updateMany(
      { userEmail: new RegExp(`^${cleanEmail}$`, 'i') },
      { $set: { departmentName: targetDepartmentName } }
    );
  }

  return {
    departments: memoryDepartments,
    updatedDepartmentName: targetDepartmentName,
  };
}

export async function upsertOrganizationGroup(
  payload: OrganizationGroupItem
): Promise<OrganizationGroupItem> {
  const normalized: OrganizationGroupItem = {
    ...payload,
    updatedAtIso: new Date().toISOString(),
  };

  const existingIdx = memoryGroups.findIndex(
    (g) => g.groupId === normalized.groupId
  );
  if (existingIdx >= 0) {
    memoryGroups[existingIdx] = normalized;
  } else {
    memoryGroups.push(normalized);
  }

  if (getMongoConnectionState()) {
    await OrganizationGroupModel.findOneAndUpdate(
      { groupId: normalized.groupId },
      { $set: normalized },
      { upsert: true, new: true }
    );
  }

  return normalized;
}

export async function deleteOrganizationGroup(
  groupId: string
): Promise<boolean> {
  memoryGroups = memoryGroups.filter((g) => g.groupId !== groupId);
  if (getMongoConnectionState()) {
    await OrganizationGroupModel.deleteOne({ groupId });
  }
  return true;
}

export async function toggleMemberInOrganizationGroup(
  groupId: string,
  userEmail: string
): Promise<OrganizationGroupItem | null> {
  const cleanEmail = userEmail.trim().toLowerCase();
  const targetGroup = memoryGroups.find((g) => g.groupId === groupId);
  if (!targetGroup) return null;

  const exists = targetGroup.memberEmails.some(
    (em) => em.trim().toLowerCase() === cleanEmail
  );
  targetGroup.memberEmails = exists
    ? targetGroup.memberEmails.filter(
        (em) => em.trim().toLowerCase() !== cleanEmail
      )
    : [...targetGroup.memberEmails, userEmail];
  targetGroup.updatedAtIso = new Date().toISOString();

  if (getMongoConnectionState()) {
    await OrganizationGroupModel.findOneAndUpdate(
      { groupId },
      {
        $set: {
          memberEmails: targetGroup.memberEmails,
          updatedAtIso: targetGroup.updatedAtIso,
        },
      }
    );
  }

  return targetGroup;
}