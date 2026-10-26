import { getMongoConnectionState } from '../../../../Shared/Database/MongoConnection';
import {
  OrganizationDepartmentItem,
  OrganizationGroupItem,
} from '../../../../Shared/Types/GlobalSystemTypes';
import {
  OrganizationDepartmentModel,
  OrganizationGroupModel,
} from '../Models/OrganizationRecordModel';
import { UserTrustProfileModel } from '../../../Datamanager/Function/Models/DatasetRecordModel';
import { UserAccountModel } from '../../../Auth/Function/Models/UserAccountModel';
import { syncMemoryTrustProfileDepartment } from '../../../Datamanager/Function/Services/DatamanagerService';

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

  syncMemoryTrustProfileDepartment(cleanEmail, targetDepartmentName);

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