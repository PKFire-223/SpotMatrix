import mongoose, { Schema } from 'mongoose';
import {
  OrganizationDepartmentItem,
  OrganizationGroupItem,
} from '../../../../Shared/Types/GlobalSystemTypes';

// 1. Schema Phòng Ban Tổ Chức (Mỗi nhân sự chỉ ở duy nhất 1 Phòng ban)
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

// 2. Schema Nhóm Chuyên Môn / Dự Án (Một nhân sự có thể tham gia nhiều Nhóm)
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