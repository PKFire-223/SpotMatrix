import mongoose, { Schema } from 'mongoose';
import {
  AuditConcurrencyLogItem,
  EquipmentFaultReportItem,
  SharedEquipmentItem,
  SystemPolicyConfigItem,
  TrustScoreHistoryRecordItem,
  UserTrustProfileItem,
} from '../../../../Shared/Types/GlobalSystemTypes';

const userTrustProfileSchema = new Schema<UserTrustProfileItem>(
  {
    userEmail: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    role: {
      type: String,
      enum: ['EMPLOYEE', 'MANAGER', 'SYS_ADMIN'],
      default: 'EMPLOYEE',
    },
    departmentName: { type: String, default: 'Product & Engineering' },
    trustScore: { type: Number, default: 100 },
    onTimeCheckInCount: { type: Number, default: 0 },
    noShowPenaltyCount: { type: Number, default: 0 },
    isRestrictedMode: { type: Boolean, default: false },
    updatedAtIso: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

const sharedEquipmentSchema = new Schema<SharedEquipmentItem>(
  {
    equipmentId: { type: String, required: true, unique: true },
    equipmentCode: { type: String, required: true },
    equipmentName: { type: String, required: true },
    categoryName: {
      type: String,
      enum: [
        'PROJECTOR',
        'MONITOR_4K',
        'WACOM_TABLET',
        'TYPE_C_HUB',
        'AUDIO_POD',
        'CONF_MIC_CAM',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: [
        'AVAILABLE',
        'IN_USE',
        'REPORTED_BROKEN',
        'MAINTENANCE',
        'BROKEN',
      ],
      default: 'AVAILABLE',
    },
    assignedNodeId: { type: String, default: null },
    position2D: {
      posX: { type: Number, required: true },
      posY: { type: Number, required: true },
    },
    currentBookingId: { type: String, default: null },
    weeklyUsageHours: { type: Number, default: 20 },
    monthlyUsageHours: { type: Number, default: 80 },
    healthPercent: { type: Number, default: 95 },
    lastReportedReason: { type: String, default: null },
    lastReportedBy: { type: String, default: null },
    lastMaintenanceNote: { type: String, default: null },
  },
  { timestamps: true }
);

const equipmentFaultReportSchema = new Schema<EquipmentFaultReportItem>(
  {
    reportId: { type: String, required: true, unique: true },
    equipmentId: { type: String, required: true },
    equipmentCode: { type: String, required: true },
    equipmentName: { type: String, required: true },
    roomCode: { type: String, required: true },
    reporterEmail: { type: String, required: true },
    reporterName: { type: String, required: true },
    reporterRole: {
      type: String,
      enum: ['EMPLOYEE', 'MANAGER', 'SYS_ADMIN'],
      default: 'EMPLOYEE',
    },
    faultReason: { type: String, required: true },
    reportStatus: {
      type: String,
      enum: [
        'PENDING_ADMIN',
        'CONFIRMED_BROKEN',
        'IN_MAINTENANCE',
        'RESOLVED_READY',
        'REJECTED',
      ],
      default: 'PENDING_ADMIN',
    },
    handledByEmail: { type: String, default: null },
    handledNote: { type: String, default: null },
    aiDiagnosisNote: { type: String, default: null },
    createdAtIso: { type: String, default: () => new Date().toISOString() },
    updatedAtIso: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true, collection: 'spotmatrix_equipment_fault_reports' }
);

const trustScoreHistorySchema = new Schema<TrustScoreHistoryRecordItem>(
  {
    recordId: { type: String, required: true, unique: true },
    userEmail: { type: String, required: true, index: true },
    fullName: { type: String, required: true },
    deltaPoints: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    eventType: {
      type: String,
      enum: [
        'MONTHLY_BONUS_20',
        'QR_CHECKIN_REWARD',
        'NO_SHOW_PENALTY',
        'INITIAL_GRANT',
      ],
      default: 'QR_CHECKIN_REWARD',
    },
    reasonText: { type: String, required: true },
    createdAtIso: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true, collection: 'spotmatrix_trust_score_history' }
);

const systemPolicyConfigSchema = new Schema<SystemPolicyConfigItem>(
  {
    policyKey: {
      type: String,
      required: true,
      unique: true,
      default: 'GLOBAL_WORKSPACE_POLICY',
    },
    holdTimeoutMinutes: { type: Number, default: 5 },
    checkinGracePeriodMinutes: { type: Number, default: 15 },
    maxMeetingHoursPerWeek: { type: Number, default: 10 },
    minTrustScoreForRecurring: { type: Number, default: 60 },
    restrictedMaxAdvanceDays: { type: Number, default: 2 },
    trustScoreCheckinReward: { type: Number, default: 2 },
    trustScoreNoshowPenalty: { type: Number, default: 10 },
    updatedByEmail: { type: String, default: 'sysadmin@spotmatrix.vn' },
    updatedAtIso: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

const auditConcurrencyLogSchema = new Schema<AuditConcurrencyLogItem>(
  {
    auditId: { type: String, required: true, unique: true },
    eventCategory: {
      type: String,
      enum: [
        'OPTIMISTIC_LOCK_WIN',
        'OPTIMISTIC_LOCK_REJECTED',
        'AUTO_RELEASE_NO_SHOW',
        'QR_CHECKIN_SUCCESS',
        'FLOORPLAN_COORD_UPDATED',
        'POLICY_CONFIG_UPDATED',
        'USER_LOGIN_SESSION',
      ],
      required: true,
    },
    actorEmail: { type: String, required: true },
    targetNodeId: { type: String, required: true },
    lockVersionAttempted: { type: Number },
    outcomeStatus: {
      type: String,
      enum: ['SUCCESS', 'CONFLICT_BLOCKED', 'AUTO_REVOKED'],
      required: true,
    },
    detailMessage: { type: String, required: true },
    ipAddress: { type: String, default: '113.161.72.104' },
    locationLabel: { type: String, default: 'TP. Hồ Chí Minh, VN' },
    createdAtIso: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

export const UserTrustProfileModel =
  mongoose.models.UserTrustProfile ||
  mongoose.model<UserTrustProfileItem>(
    'UserTrustProfile',
    userTrustProfileSchema
  );

export const SharedEquipmentModel =
  mongoose.models.SharedEquipment ||
  mongoose.model<SharedEquipmentItem>('SharedEquipment', sharedEquipmentSchema);

export const EquipmentFaultReportModel =
  mongoose.models.EquipmentFaultReport ||
  mongoose.model<EquipmentFaultReportItem>(
    'EquipmentFaultReport',
    equipmentFaultReportSchema
  );

export const TrustScoreHistoryModel =
  mongoose.models.TrustScoreHistory ||
  mongoose.model<TrustScoreHistoryRecordItem>(
    'TrustScoreHistory',
    trustScoreHistorySchema
  );

export const SystemPolicyConfigModel =
  mongoose.models.SystemPolicyConfig ||
  mongoose.model<SystemPolicyConfigItem>(
    'SystemPolicyConfig',
    systemPolicyConfigSchema
  );

export const AuditConcurrencyLogModel =
  mongoose.models.AuditConcurrencyLog ||
  mongoose.model<AuditConcurrencyLogItem>(
    'AuditConcurrencyLog',
    auditConcurrencyLogSchema
  );
