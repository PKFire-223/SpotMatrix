import mongoose, { Schema } from 'mongoose';
import {
  AuditConcurrencyLogItem,
  OrganizationDepartmentItem,
  OrganizationGroupItem,
  SharedEquipmentItem,
  SystemPolicyConfigItem,
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
      enum: ['AVAILABLE', 'IN_USE', 'BROKEN'],
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
  },
  { timestamps: true }
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
    createdAtIso: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

const organizationDepartmentSchema = new Schema<OrganizationDepartmentItem>(
  {
    departmentId: { type: String, required: true, unique: true },
    departmentCode: { type: String, required: true },
    departmentName: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    managerEmail: { type: String, default: 'manager.lead@spotmatrix.vn' },
    managerName: { type: String, default: 'Lê Thu Hà (Quản lý)' },
    floorLocation: { type: String, default: 'Tầng 1 - Tầng 2' },
    colorBadge: {
      type: String,
      enum: ['INDIGO', 'TEAL', 'AMBER', 'ROSE'],
      default: 'INDIGO',
    },
    memberEmails: { type: [String], default: [] },
    updatedAtIso: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true, collection: 'spotmatrix_organization_departments' }
);

const organizationGroupSchema = new Schema<OrganizationGroupItem>(
  {
    groupId: { type: String, required: true, unique: true },
    groupCode: { type: String, required: true },
    groupName: { type: String, required: true },
    departmentName: { type: String, required: true },
    description: { type: String, default: '' },
    leaderEmail: { type: String, default: 'manager.lead@spotmatrix.vn' },
    leaderName: { type: String, default: 'Lê Thu Hà (Quản lý)' },
    projectTag: { type: String, default: 'SpotMatrix 3D' },
    memberEmails: { type: [String], default: [] },
    updatedAtIso: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true, collection: 'spotmatrix_organization_groups' }
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

export const OrganizationDepartmentModel =
  mongoose.models.OrganizationDepartment ||
  mongoose.model<OrganizationDepartmentItem>(
    'OrganizationDepartment',
    organizationDepartmentSchema
  );

export const OrganizationGroupModel =
  mongoose.models.OrganizationGroup ||
  mongoose.model<OrganizationGroupItem>(
    'OrganizationGroup',
    organizationGroupSchema
  );