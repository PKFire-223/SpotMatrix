import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Layers,
  UserPlus,
  Sparkles,
  Calendar,
  X,
  ArrowRightLeft,
  Search,
  Lock,
  ArrowRight,
} from 'lucide-react';
import {
  BookingPayloadItem,
  OrganizationDepartmentItem,
  OrganizationGroupItem,
  UserRoleType,
  UserTrustProfileItem,
  WebLanguageCodeType,
} from '../../../Shared/Types/GlobalSystemTypes';
import { formatPersonDisplayNameForLocale } from '../Groups/DepartmentGroupsPanel';
import {
  DepartmentDetailPages,
  formatFloorLocationForLocale,
} from './DepartmentDetailPages';

export interface OrganizationPagesProps {
  departmentsList: OrganizationDepartmentItem[];
  groupsList: OrganizationGroupItem[];
  trustProfiles: UserTrustProfileItem[];
  bookingsList: BookingPayloadItem[];
  userEmail: string;
  userRole: UserRoleType;
  userDepartment: string;
  webLanguage?: WebLanguageCodeType;
  isDark: boolean;
  onUpsertDepartment: (dept: OrganizationDepartmentItem) => void;
  onDeleteDepartment: (departmentId: string) => void;
  onAssignUserSingleDepartment: (
    targetUserEmail: string,
    nextDepartmentName: string
  ) => void;
  onUpsertGroup: (group: OrganizationGroupItem) => void;
  onDeleteGroup: (groupId: string) => void;
  onToggleGroupMember: (groupId: string, targetUserEmail: string) => void;
  onNavigateToHallBooking?: () => void;
}

const STANDARD_FLOOR_LOCATIONS = [
  'Tầng 1 — Khu Phòng họp Chuẩn',
  'Tầng 2 — Khu Kỹ thuật & Sprint',
  'Tầng 3 — Khu Thiết kế & Sáng tạo',
  'Tầng 4 — Khu AI & Khoa học Dữ liệu',
  'Tầng 5 — Hội trường Đấu Trường La Mã',
  'Tầng 1 & Tầng 5 (Hội trường)',
  'Tầng 2 & Tầng 3',
  'Tầng 3 & Tầng 4',
  'Toàn bộ 5 Tầng Tòa nhà',
];

const EXTENDED_COMPANY_DIRECTORY: UserTrustProfileItem[] = [
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
  {
    userEmail: 'tran.bao.ngoc@spotmatrix.vn',
    fullName: 'Trần Bảo Ngọc (UX Lead)',
    role: 'MANAGER',
    departmentName: 'Product Design & UX',
    trustScore: 98,
    onTimeCheckInCount: 22,
    noShowPenaltyCount: 0,
    isRestrictedMode: false,
    updatedAtIso: new Date().toISOString(),
  },
  {
    userEmail: 'pham.hoang.nam@spotmatrix.vn',
    fullName: 'Phạm Hoàng Nam (AI Researcher)',
    role: 'EMPLOYEE',
    departmentName: 'AI & Data Science',
    trustScore: 95,
    onTimeCheckInCount: 15,
    noShowPenaltyCount: 0,
    isRestrictedMode: false,
    updatedAtIso: new Date().toISOString(),
  },
  {
    userEmail: 'vu.khanh.linh@spotmatrix.vn',
    fullName: 'Vũ Khánh Linh (Chưa phân bổ)',
    role: 'EMPLOYEE',
    departmentName: 'Chưa phân bổ',
    trustScore: 100,
    onTimeCheckInCount: 10,
    noShowPenaltyCount: 0,
    isRestrictedMode: false,
    updatedAtIso: new Date().toISOString(),
  },
  {
    userEmail: 'dang.quoc.viet@spotmatrix.vn',
    fullName: 'Đặng Quốc Việt (Chưa phân bổ)',
    role: 'EMPLOYEE',
    departmentName: 'Chưa phân bổ',
    trustScore: 99,
    onTimeCheckInCount: 12,
    noShowPenaltyCount: 0,
    isRestrictedMode: false,
    updatedAtIso: new Date().toISOString(),
  },
];

const ORG_I18N: Record<
  WebLanguageCodeType,
  {
    title: string;
    roleBadgeAdmin: string;
    roleBadgeManager: string;
    roleBadgeEmployee: string;
    subTitle: string;
    tab1: (c: number) => string;
    tab2: string;
    loggedAccountLabel: string;
    singleDeptLabel: string;
    employeeReadOnlyHint: string;
    searchDeptPlaceholder: string;
    createDeptBtn: string;
    createGroupBtn: string;
    openDetailPageBtn: string;
    managerLabel: string;
    floorZoneLabel: string;
    membersCount: (c: number) => string;
    groupsCount: (c: number) => string;
    addMemberBtn: string;
    searchEmpPlaceholder: string;
    noGroupYet: string;
    matrixTitle: string;
    matrixSub: string;
    colMember: string;
    colRole: string;
    colSingleDept: string;
    colJoinedGroups: string;
    unassignedOpt: string;
    hallEventsCardTitle: string;
    lockedOtherDeptLabel: (d: string) => string;
    joinedBadge: string;
    modalDeptCodeLabel: string;
    modalDeptNameLabel: string;
    modalDeptDescPlaceholder: string;
    modalGroupCodeLabel: string;
    modalGroupDeptLabel: string;
    modalGroupNamePlaceholder: string;
    saveBtn: string;
  }
> = {
  vi: {
    title: 'Cơ cấu Tổ chức — Quản lý Phòng ban & Các Nhóm Chuyên biệt Trực thuộc',
    roleBadgeAdmin: 'SYS_ADMIN • Toàn quyền Tạo / Sửa / Xóa Phòng ban & Nhóm',
    roleBadgeManager: 'MANAGER • Được phép Tạo Phòng ban & Quản lý Nhóm',
    roleBadgeEmployee: 'EMPLOYEE • Chế độ Chỉ Xem (Nhân viên không được tạo Phòng ban)',
    subTitle:
      'Bấm vào từng Phòng ban để chuyển sang Trang Chi tiết Phòng ban riêng biệt • Chỉ Quản lý (MANAGER) và Admin (SYS_ADMIN) mới có quyền tạo Phòng ban.',
    tab1: (c) => `Danh sách Phòng ban (${c})`,
    tab2: 'Ma trận Thành viên & Sự kiện Hội trường (Admin)',
    loggedAccountLabel: 'Tài khoản đang đăng nhập:',
    singleDeptLabel: 'Phòng ban duy nhất của bạn:',
    employeeReadOnlyHint:
      'Vai trò Nhân viên (EMPLOYEE) chỉ có quyền xem thông tin phòng ban, không thể tạo hoặc chỉnh sửa.',
    searchDeptPlaceholder: 'Tìm phòng ban, mã, quản lý...',
    createDeptBtn: 'Tạo Phòng ban Mới',
    createGroupBtn: 'Tạo Nhóm Mới',
    openDetailPageBtn: 'Mở Trang Chi Tiết Phòng Ban',
    managerLabel: 'Quản lý Phụ trách:',
    floorZoneLabel: 'Khu vực Tầng Hoạt động:',
    membersCount: (c) => `${c} nhân sự`,
    groupsCount: (c) => `${c} nhóm chuyên biệt`,
    addMemberBtn: '+ Thêm Thành viên',
    searchEmpPlaceholder: 'Tìm nhân viên theo tên, email...',
    noGroupYet: 'Chưa vào nhóm',
    matrixTitle:
      'Bảng Kiểm chứng Quan hệ: 1 Phòng ban Duy nhất & Đa Nhóm Chuyên biệt (SYS_ADMIN)',
    matrixSub: 'Chỉ System Admin mới nhìn thấy bảng điều phối tổng thể này.',
    colMember: 'Nhân sự',
    colRole: 'Vai trò',
    colSingleDept: 'Phòng ban Duy nhất (1)',
    colJoinedGroups: 'Các Nhóm Tham gia (Cùng Phòng ban)',
    unassignedOpt: '-- Chưa phân bổ phòng ban --',
    hallEventsCardTitle:
      'Sự kiện Hội trường Tầng 5 (H-01) & Phân quyền Phòng ban',
    lockedOtherDeptLabel: (d) => `Không thể chỉ định (${d})`,
    joinedBadge: 'Đã thuộc phòng ban',
    modalDeptCodeLabel: 'Mã Phòng ban',
    modalDeptNameLabel: 'Tên Phòng ban',
    modalDeptDescPlaceholder: 'Mô tả chức năng và phạm vi hoạt động của phòng ban...',
    modalGroupCodeLabel: 'Mã Nhóm (Squad)',
    modalGroupDeptLabel: 'Phòng ban Trực thuộc',
    modalGroupNamePlaceholder: 'Nhập tên nhóm chuyên môn...',
    saveBtn: 'Lưu thông tin',
  },
  en: {
    title: 'Organization Structure — Departments & Specialized Sub-Groups',
    roleBadgeAdmin: 'SYS_ADMIN • Full Create / Edit / Delete Access',
    roleBadgeManager: 'MANAGER • Authorized to Create Departments & Manage Groups',
    roleBadgeEmployee: 'EMPLOYEE • Read-Only Mode (Employees cannot create Departments)',
    subTitle:
      'Click any Department card to open its dedicated Department Detail Page • Only Managers and System Admins can create or modify Departments.',
    tab1: (c) => `Department Directory (${c})`,
    tab2: 'Member Matrix & Hall Events (Admin)',
    loggedAccountLabel: 'Signed-in Account:',
    singleDeptLabel: 'Your Assigned Department:',
    employeeReadOnlyHint:
      'Employees (EMPLOYEE) have read-only access and cannot create or modify departments.',
    searchDeptPlaceholder: 'Search department, code, manager...',
    createDeptBtn: 'New Department',
    createGroupBtn: 'New Sub-Group',
    openDetailPageBtn: 'Open Department Detail Page',
    managerLabel: 'Department Manager:',
    floorZoneLabel: 'Primary Floor Zone:',
    membersCount: (c) => `${c} members`,
    groupsCount: (c) => `${c} sub-groups`,
    addMemberBtn: '+ Add Member',
    searchEmpPlaceholder: 'Search employee by name, email...',
    noGroupYet: 'No group yet',
    matrixTitle:
      'Single-Department & Multi-Squad Assignment Matrix (SYS_ADMIN Exclusive)',
    matrixSub: 'Only System Administrators can view and reassign company-wide memberships.',
    colMember: 'Employee',
    colRole: 'Role',
    colSingleDept: 'Assigned Department (1)',
    colJoinedGroups: 'Joined Sub-Groups (Same Dept)',
    unassignedOpt: '-- Unassigned --',
    hallEventsCardTitle:
      'Floor 5 Colosseum Hall (H-01) Events & Department Access',
    lockedOtherDeptLabel: (d) => `Locked (${d})`,
    joinedBadge: 'Joined',
    modalDeptCodeLabel: 'Department Code',
    modalDeptNameLabel: 'Department Name',
    modalDeptDescPlaceholder: 'Describe department responsibilities and scope...',
    modalGroupCodeLabel: 'Sub-Group Code',
    modalGroupDeptLabel: 'Parent Department',
    modalGroupNamePlaceholder: 'Enter specialized sub-group name...',
    saveBtn: 'Save Changes',
  },
  ja: {
    title: '組織構造 — 部署管理および所属専門グループ',
    roleBadgeAdmin: 'SYS_ADMIN • 全部署＆グループ作成・編集・削除権限',
    roleBadgeManager: 'MANAGER • 部署作成および専門グループ管理が可能',
    roleBadgeEmployee: 'EMPLOYEE • 閲覧専用モード（一般社員は部署を作成できません）',
    subTitle:
      '各部署カードをクリックすると専用の「部署詳細ページ」へ移動します • 部署の作成・編集はマネージャー(MANAGER)と管理者(SYS_ADMIN)のみ可能です。',
    tab1: (c) => `部署一覧 (${c})`,
    tab2: 'メンバー連携＆5階ホールイベント (Admin)',
    loggedAccountLabel: 'ログイン中のアカウント:',
    singleDeptLabel: 'あなたの所属部署:',
    employeeReadOnlyHint:
      '一般社員 (EMPLOYEE) は閲覧のみ可能で、部署やグループの作成・変更はできません。',
    searchDeptPlaceholder: '部署名、コード、マネージャーで検索...',
    createDeptBtn: '新規部署を作成',
    createGroupBtn: '新規グループを作成',
    openDetailPageBtn: '部署詳細ページを開く',
    managerLabel: '担当マネージャー:',
    floorZoneLabel: '主要活動フロア:',
    membersCount: (c) => `${c} 名の社員`,
    groupsCount: (c) => `${c} 専門グループ`,
    addMemberBtn: '+ メンバー追加',
    searchEmpPlaceholder: '氏名、メールアドレスで社員を検索...',
    noGroupYet: '未参加',
    matrixTitle:
      '単一部署・複数専門グループ配属マトリックス (SYS_ADMIN 専用)',
    matrixSub: '全社員の所属部署と専門グループの対応関係を管理します。',
    colMember: '社員名',
    colRole: 'ロール',
    colSingleDept: '単一所属部署 (1)',
    colJoinedGroups: '参加専門グループ (同一部署内)',
    unassignedOpt: '-- 未配属 --',
    hallEventsCardTitle:
      '5階コロッセオ大ホール (H-01) イベント＆部署別アクセス権限',
    lockedOtherDeptLabel: (d) => `指定不可 (${d})`,
    joinedBadge: '所属済',
    modalDeptCodeLabel: '部署コード',
    modalDeptNameLabel: '部署名',
    modalDeptDescPlaceholder: '部署の業務内容や管轄範囲を入力してください...',
    modalGroupCodeLabel: 'グループコード',
    modalGroupDeptLabel: '管轄部署',
    modalGroupNamePlaceholder: '専門グループ名を入力...',
    saveBtn: '保存する',
  },
};

export const OrganizationPages: React.FC<OrganizationPagesProps> = ({
  departmentsList,
  groupsList,
  trustProfiles,
  bookingsList,
  userEmail,
  userRole,
  userDepartment,
  webLanguage = 'vi',
  isDark,
  onUpsertDepartment,
  onDeleteDepartment,
  onAssignUserSingleDepartment,
  onUpsertGroup,
  onDeleteGroup,
  onToggleGroupMember,
  onNavigateToHallBooking,
}) => {
  const isSysAdmin = userRole === 'SYS_ADMIN';
  // Quy tắc RBAC: Chỉ Quản lý (MANAGER) và Admin (SYS_ADMIN) mới có thể tác động tạo/chỉnh sửa Phòng ban & Nhóm. Nhân viên (EMPLOYEE) không tạo được!
  const canCreateOrEditOrg = userRole === 'SYS_ADMIN' || userRole === 'MANAGER';
  const t = ORG_I18N[webLanguage] || ORG_I18N.vi;

  const [activeTab, setActiveTab] = useState<'DEPARTMENTS' | 'MEMBER_MATRIX'>(
    'DEPARTMENTS'
  );
  const [deptSearchQuery, setDeptSearchQuery] = useState<string>('');
  // Khi null -> hiển thị trang Danh sách Phòng ban; khi có ID -> chuyển hẳn sang Trang Chi tiết Phòng ban riêng biệt
  const [openedDetailPageDeptId, setOpenedDetailPageDeptId] = useState<
    string | null
  >(null);

  const allCompanyMembers = useMemo(() => {
    const map = new Map<string, UserTrustProfileItem>();
    EXTENDED_COMPANY_DIRECTORY.forEach((item) => {
      map.set(item.userEmail.toLowerCase(), { ...item });
    });
    trustProfiles.forEach((tp) => {
      map.set(tp.userEmail.toLowerCase(), { ...tp });
    });
    departmentsList.forEach((dept) => {
      dept.memberEmails.forEach((em) => {
        const key = em.trim().toLowerCase();
        const existing = map.get(key);
        if (existing) {
          map.set(key, { ...existing, departmentName: dept.departmentName });
        }
      });
    });
    return Array.from(map.values());
  }, [trustProfiles, departmentsList]);

  const roleFilteredCompanyMembers = useMemo(() => {
    return allCompanyMembers.filter(
      (m) => isSysAdmin || m.role !== 'SYS_ADMIN'
    );
  }, [allCompanyMembers, isSysAdmin]);

  const visibleDepartments = useMemo(() => {
    const q = deptSearchQuery.trim().toLowerCase();
    return departmentsList.filter((dept) => {
      if (userRole === 'EMPLOYEE') {
        const isMyDept =
          dept.departmentName.trim().toLowerCase() ===
            userDepartment.trim().toLowerCase() ||
          dept.memberEmails.some(
            (em) => em.trim().toLowerCase() === userEmail.trim().toLowerCase()
          );
        if (!isMyDept) return false;
      }
      if (!q) return true;
      return (
        dept.departmentName.toLowerCase().includes(q) ||
        dept.departmentCode.toLowerCase().includes(q) ||
        dept.managerName.toLowerCase().includes(q) ||
        dept.floorLocation.toLowerCase().includes(q)
      );
    });
  }, [departmentsList, userRole, userDepartment, userEmail, deptSearchQuery]);

  const activeOpenedDepartment = useMemo(() => {
    if (!openedDetailPageDeptId) return null;
    return (
      departmentsList.find((d) => d.departmentId === openedDetailPageDeptId) ||
      null
    );
  }, [departmentsList, openedDetailPageDeptId]);

  const [isDeptModalOpen, setIsDeptModalOpen] = useState<boolean>(false);
  const [editingDept, setEditingDept] =
    useState<OrganizationDepartmentItem | null>(null);
  const [deptCodeInput, setDeptCodeInput] = useState<string>('');
  const [deptNameInput, setDeptNameInput] = useState<string>('');
  const [deptDescInput, setDeptDescInput] = useState<string>('');
  const [deptManagerEmailInput, setDeptManagerEmailInput] = useState<string>(
    'manager.lead@spotmatrix.vn'
  );
  const [deptFloorInput, setDeptFloorInput] = useState<string>(
    STANDARD_FLOOR_LOCATIONS[1]
  );
  const [deptColorInput, setDeptColorInput] = useState<
    'INDIGO' | 'TEAL' | 'AMBER' | 'ROSE'
  >('INDIGO');

  const openCreateDepartmentModal = () => {
    if (!canCreateOrEditOrg) return;
    setEditingDept(null);
    setDeptCodeInput(`DEPT-${Math.floor(Math.random() * 90 + 10)}`);
    setDeptNameInput('');
    setDeptDescInput('');
    setDeptManagerEmailInput(
      allCompanyMembers[1]?.userEmail || 'manager.lead@spotmatrix.vn'
    );
    setDeptFloorInput(STANDARD_FLOOR_LOCATIONS[1]);
    setDeptColorInput('INDIGO');
    setIsDeptModalOpen(true);
  };

  const openEditDepartmentModal = (dept: OrganizationDepartmentItem) => {
    if (!canCreateOrEditOrg) return;
    setEditingDept(dept);
    setDeptCodeInput(dept.departmentCode);
    setDeptNameInput(dept.departmentName);
    setDeptDescInput(dept.description);
    setDeptManagerEmailInput(dept.managerEmail || 'manager.lead@spotmatrix.vn');
    setDeptFloorInput(
      STANDARD_FLOOR_LOCATIONS.includes(dept.floorLocation)
        ? dept.floorLocation
        : STANDARD_FLOOR_LOCATIONS[0]
    );
    setDeptColorInput(dept.colorBadge);
    setIsDeptModalOpen(true);
  };

  const handleSaveDepartmentForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateOrEditOrg || !deptNameInput.trim()) return;

    const selectedMgr = allCompanyMembers.find(
      (m) =>
        m.userEmail.trim().toLowerCase() ===
        deptManagerEmailInput.trim().toLowerCase()
    );
    const managerFullName = selectedMgr
      ? selectedMgr.fullName
      : editingDept?.managerName || 'Lê Thu Hà (Quản lý)';

    const payload: OrganizationDepartmentItem = {
      departmentId: editingDept?.departmentId || `DEPT-${Date.now()}`,
      departmentCode: deptCodeInput.trim().toUpperCase(),
      departmentName: deptNameInput.trim(),
      description:
        deptDescInput.trim() ||
        'Phòng ban chuyên trách thuộc hệ thống SpotMatrix',
      managerEmail: deptManagerEmailInput,
      managerName: managerFullName,
      floorLocation: deptFloorInput,
      colorBadge: deptColorInput,
      memberEmails: editingDept?.memberEmails || [deptManagerEmailInput],
      updatedAtIso: new Date().toISOString(),
    };

    onUpsertDepartment(payload);
    setIsDeptModalOpen(false);
  };

  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] =
    useState<OrganizationGroupItem | null>(null);
  const [grpCodeInput, setGrpCodeInput] = useState<string>('');
  const [grpNameInput, setGrpNameInput] = useState<string>('');
  const [grpDeptInput, setGrpDeptInput] = useState<string>(
    departmentsList[0]?.departmentName || 'Product & Engineering'
  );
  const [grpDescInput, setGrpDescInput] = useState<string>('');
  const [grpLeaderEmailInput, setGrpLeaderEmailInput] = useState<string>(
    'manager.lead@spotmatrix.vn'
  );
  const [grpTagInput, setGrpTagInput] = useState<string>('SpotMatrix 3D');

  const eligibleGroupLeaders = useMemo(() => {
    const inDept = allCompanyMembers.filter(
      (m) =>
        m.departmentName.trim().toLowerCase() ===
        grpDeptInput.trim().toLowerCase()
    );
    return inDept.length > 0 ? inDept : allCompanyMembers;
  }, [allCompanyMembers, grpDeptInput]);

  const openCreateGroupModal = (preselectedDeptName?: string) => {
    if (!canCreateOrEditOrg) return;
    const targetDeptName =
      preselectedDeptName ||
      activeOpenedDepartment?.departmentName ||
      departmentsList[0]?.departmentName ||
      'Product & Engineering';
    const deptMembers = allCompanyMembers.filter(
      (m) =>
        m.departmentName.trim().toLowerCase() ===
        targetDeptName.trim().toLowerCase()
    );

    setEditingGroup(null);
    setGrpCodeInput(`SQUAD-${Math.floor(Math.random() * 90 + 10)}`);
    setGrpNameInput('');
    setGrpDeptInput(targetDeptName);
    setGrpDescInput('');
    setGrpLeaderEmailInput(
      deptMembers[0]?.userEmail || 'manager.lead@spotmatrix.vn'
    );
    setGrpTagInput('3D Spatial Squad');
    setIsGroupModalOpen(true);
  };

  const openEditGroupModal = (group: OrganizationGroupItem) => {
    if (!canCreateOrEditOrg) return;
    setEditingGroup(group);
    setGrpCodeInput(group.groupCode);
    setGrpNameInput(group.groupName);
    setGrpDeptInput(group.departmentName);
    setGrpDescInput(group.description);
    setGrpLeaderEmailInput(group.leaderEmail || 'manager.lead@spotmatrix.vn');
    setGrpTagInput(group.projectTag);
    setIsGroupModalOpen(true);
  };

  const handleSaveGroupForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateOrEditOrg || !grpNameInput.trim()) return;

    const selectedLeader = allCompanyMembers.find(
      (m) =>
        m.userEmail.trim().toLowerCase() ===
        grpLeaderEmailInput.trim().toLowerCase()
    );
    const leaderFullName = selectedLeader
      ? selectedLeader.fullName
      : editingGroup?.leaderName || 'Lê Thu Hà (Quản lý)';

    const payload: OrganizationGroupItem = {
      groupId: editingGroup?.groupId || `GRP-${Date.now()}`,
      groupCode: grpCodeInput.trim().toUpperCase(),
      groupName: grpNameInput.trim(),
      departmentName: grpDeptInput,
      description:
        grpDescInput.trim() ||
        'Nhóm chuyên môn phát triển và vận hành tính năng',
      leaderEmail: grpLeaderEmailInput,
      leaderName: leaderFullName,
      projectTag: grpTagInput.trim() || 'SpotMatrix Core',
      memberEmails: editingGroup?.memberEmails || [grpLeaderEmailInput],
      updatedAtIso: new Date().toISOString(),
    };

    onUpsertGroup(payload);
    setIsGroupModalOpen(false);
  };

  const [assignMemberModalDept, setAssignMemberModalDept] =
    useState<OrganizationDepartmentItem | null>(null);
  const [assignMemberSearch, setAssignMemberSearch] = useState<string>('');

  const filteredAssignCandidates = useMemo(() => {
    const q = assignMemberSearch.trim().toLowerCase();
    return roleFilteredCompanyMembers.filter((m) => {
      if (!q) return true;
      return (
        m.fullName.toLowerCase().includes(q) ||
        m.userEmail.toLowerCase().includes(q) ||
        m.departmentName.toLowerCase().includes(q)
      );
    });
  }, [roleFilteredCompanyMembers, assignMemberSearch]);

  const hallEventsList = useMemo(() => {
    return bookingsList.filter(
      (b) =>
        (b.nodeId === 'H-01' || b.bookingMode === 'HALL_EVENT_RENTAL') &&
        b.bookingStatus !== 'CANCELLED'
    );
  }, [bookingsList]);

  return (
    <div className="space-y-6">
      {/* NẾU ĐANG MỞ TRANG CHI TIẾT PHÒNG BAN -> HIỂN THỊ TRANG CHI TIẾT ĐỘC LẬP */}
      {activeOpenedDepartment ? (
        <DepartmentDetailPages
          department={activeOpenedDepartment}
          groupsList={groupsList}
          allCompanyMembers={allCompanyMembers}
          bookingsList={bookingsList}
          userEmail={userEmail}
          userRole={userRole}
          webLanguage={webLanguage}
          isDark={isDark}
          onBackToList={() => setOpenedDetailPageDeptId(null)}
          onOpenEditDepartment={openEditDepartmentModal}
          onDeleteDepartment={onDeleteDepartment}
          onOpenAssignMemberModal={(dept) => {
            if (!canCreateOrEditOrg) return;
            setAssignMemberModalDept(dept);
            setAssignMemberSearch('');
          }}
          onRemoveMemberFromDepartment={(targetEmail) => {
            if (!canCreateOrEditOrg) return;
            onAssignUserSingleDepartment(targetEmail, 'Chưa phân bổ');
          }}
          onOpenCreateGroupForDept={(deptName) => openCreateGroupModal(deptName)}
          onOpenEditGroup={openEditGroupModal}
          onDeleteGroup={onDeleteGroup}
          onToggleGroupMember={onToggleGroupMember}
          onNavigateToHallBooking={onNavigateToHallBooking}
        />
      ) : (
        <>
          {/* Header Banner */}
          <div
            className={`p-6 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-indigo-100/80 shadow-sm'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                  <Building2 className="w-5 h-5" />
                </span>
                <h1 className="text-lg font-black tracking-tight">{t.title}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                    isSysAdmin
                      ? 'bg-indigo-600 text-white'
                      : userRole === 'MANAGER'
                      ? 'bg-teal-600 text-white'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                  }`}
                >
                  {isSysAdmin
                    ? t.roleBadgeAdmin
                    : userRole === 'MANAGER'
                    ? t.roleBadgeManager
                    : t.roleBadgeEmployee}
                </span>
              </div>
              <p className="text-xs text-slate-400">{t.subTitle}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('DEPARTMENTS')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                  activeTab === 'DEPARTMENTS'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{t.tab1(visibleDepartments.length)}</span>
              </button>

              {isSysAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('MEMBER_MATRIX')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                    activeTab === 'MEMBER_MATRIX'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{t.tab2}</span>
                </button>
              )}
            </div>
          </div>

          {/* Thanh Trạng thái Cá nhân & Tìm kiếm / Nút Tạo Phòng ban (Chỉ mở cho MANAGER & SYS_ADMIN) */}
          <div
            className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              isDark
                ? 'bg-indigo-950/30 border-indigo-500/30'
                : 'bg-indigo-50/70 border-indigo-200/70'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {t.loggedAccountLabel}{' '}
                </span>
                <strong>{userEmail}</strong>
                <span className="mx-2 text-slate-400">•</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {t.singleDeptLabel}{' '}
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold">
                  {userDepartment}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={deptSearchQuery}
                  onChange={(e) => setDeptSearchQuery(e.target.value)}
                  placeholder={t.searchDeptPlaceholder}
                  className={`w-full pl-8 pr-7 py-2 rounded-xl border text-xs font-semibold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
                {deptSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setDeptSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {canCreateOrEditOrg ? (
                <>
                  <button
                    type="button"
                    onClick={openCreateDepartmentModal}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.createDeptBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreateGroupModal()}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.createGroupBtn}</span>
                  </button>
                </>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t.employeeReadOnlyHint}</span>
                </span>
              )}
            </div>
          </div>

          {/* TAB 1: DANH SÁCH THẺ PHÒNG BAN (BẤM VÀO SẼ MỞ TRANG CHI TIẾT PHÒNG BAN RIÊNG) */}
          {activeTab === 'DEPARTMENTS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {visibleDepartments.map((dept) => {
                const deptMembers = roleFilteredCompanyMembers.filter(
                  (m) =>
                    dept.memberEmails.some(
                      (em) =>
                        em.trim().toLowerCase() ===
                        m.userEmail.trim().toLowerCase()
                    ) ||
                    m.departmentName.trim().toLowerCase() ===
                      dept.departmentName.trim().toLowerCase()
                );

                const subGroupsCount = groupsList.filter(
                  (g) =>
                    g.departmentName.trim().toLowerCase() ===
                    dept.departmentName.trim().toLowerCase()
                ).length;

                return (
                  <div
                    key={dept.departmentId}
                    onClick={() => setOpenedDetailPageDeptId(dept.departmentId)}
                    className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 cursor-pointer transition-all group ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/60 shadow-sm hover:shadow-xl'
                        : 'bg-white border-indigo-100/80 hover:border-indigo-400 shadow-sm hover:shadow-lg'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-indigo-600 text-white">
                              {dept.departmentCode}
                            </span>
                            <h3 className="text-base font-black group-hover:text-indigo-500 transition">
                              {dept.departmentName}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {dept.description}
                          </p>
                        </div>

                        {canCreateOrEditOrg && (
                          <div
                            className="flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => openEditDepartmentModal(dept)}
                              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                            </button>
                            {isSysAdmin && (
                              <button
                                type="button"
                                onClick={() =>
                                  onDeleteDepartment(dept.departmentId)
                                }
                                className="p-2 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl border grid grid-cols-2 gap-3 text-xs ${
                          isDark
                            ? 'bg-slate-950/70 border-slate-800'
                            : 'bg-slate-50 border-slate-200/70'
                        }`}
                      >
                        <div>
                          <span className="text-[10px] text-slate-400 block">
                            {t.managerLabel}
                          </span>
                          <strong className="font-bold">
                            {formatPersonDisplayNameForLocale(
                              dept.managerName,
                              webLanguage
                            )}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">
                            {t.floorZoneLabel}
                          </span>
                          <strong className="font-bold text-indigo-500">
                            {formatFloorLocationForLocale(
                              dept.floorLocation,
                              webLanguage
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                        <div className="flex items-center gap-3 text-xs font-extrabold">
                          <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                            <Users className="w-3.5 h-3.5" />
                            {t.membersCount(deptMembers.length)}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">
                            •
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                            <Layers className="w-3.5 h-3.5" />
                            {t.groupsCount(subGroupsCount)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {canCreateOrEditOrg && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssignMemberModalDept(dept);
                                setAssignMemberSearch('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-teal-600/15 hover:bg-teal-600 text-teal-600 dark:text-teal-300 hover:text-white text-xs font-extrabold flex items-center gap-1 transition"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{t.addMemberBtn}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenedDetailPageDeptId(dept.departmentId);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                          >
                            <span>{t.openDetailPageBtn}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: MA TRẬN THÀNH VIÊN & SỰ KIỆN HỘI TRƯỜNG (ADMIN) */}
          {activeTab === 'MEMBER_MATRIX' && isSysAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div
                className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800'
                    : 'bg-white border-indigo-100/80 shadow-sm'
                }`}
              >
                <div>
                  <h3 className="text-sm font-black">{t.matrixTitle}</h3>
                  <p className="text-xs text-slate-400">{t.matrixSub}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 uppercase">
                        <th className="py-2.5 pr-3">{t.colMember}</th>
                        <th className="py-2.5 px-3">{t.colRole}</th>
                        <th className="py-2.5 px-3">{t.colSingleDept}</th>
                        <th className="py-2.5 pl-3">{t.colJoinedGroups}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
                      {allCompanyMembers.map((tp) => {
                        const userGroups = groupsList.filter(
                          (g) =>
                            g.departmentName.trim().toLowerCase() ===
                              tp.departmentName.trim().toLowerCase() &&
                            g.memberEmails.some(
                              (em) =>
                                em.trim().toLowerCase() ===
                                tp.userEmail.trim().toLowerCase()
                            )
                        );
                        return (
                          <tr key={tp.userEmail}>
                            <td className="py-3 pr-3">
                              <p className="font-extrabold">
                                {formatPersonDisplayNameForLocale(
                                  tp.fullName,
                                  webLanguage
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {tp.userEmail}
                              </p>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/15 text-indigo-500">
                                {tp.role}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <select
                                value={tp.departmentName}
                                onChange={(e) =>
                                  onAssignUserSingleDepartment(
                                    tp.userEmail,
                                    e.target.value
                                  )
                                }
                                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold ${
                                  isDark
                                    ? 'bg-slate-950 border-slate-800 text-indigo-300'
                                    : 'bg-slate-50 border-slate-200 text-indigo-700'
                                }`}
                              >
                                <option value="Chưa phân bổ">
                                  {t.unassignedOpt}
                                </option>
                                {departmentsList.map((d) => (
                                  <option
                                    key={d.departmentId}
                                    value={d.departmentName}
                                  >
                                    {d.departmentName}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 pl-3">
                              <div className="flex flex-wrap gap-1">
                                {userGroups.length === 0 ? (
                                  <span className="text-[11px] text-slate-400 italic">
                                    {t.noGroupYet}
                                  </span>
                                ) : (
                                  userGroups.map((ug) => (
                                    <span
                                      key={ug.groupId}
                                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/15 text-teal-600 dark:text-teal-300"
                                    >
                                      {ug.groupName}
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div
                className={`lg:col-span-5 p-6 rounded-3xl border space-y-4 ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800'
                    : 'bg-white border-indigo-100/80 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-black">
                      {t.hallEventsCardTitle}
                    </h3>
                  </div>
                  {onNavigateToHallBooking && (
                    <button
                      type="button"
                      onClick={onNavigateToHallBooking}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold"
                    >
                      H-01
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {hallEventsList.map((ev) => (
                    <div
                      key={ev.bookingId}
                      className={`p-4 rounded-2xl border space-y-2 ${
                        isDark
                          ? 'bg-slate-950/70 border-slate-800'
                          : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-indigo-500 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {ev.bookingDateIso || 'Today'} ({ev.startTimeIso} –{' '}
                          {ev.endTimeIso})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            ev.approvalStatus === 'APPROVED'
                              ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                              : 'bg-amber-500/15 text-amber-600'
                          }`}
                        >
                          {ev.approvalStatus === 'APPROVED'
                            ? 'APPROVED'
                            : 'PENDING'}
                        </span>
                      </div>
                      <p className="text-xs font-bold">{ev.purposeNote}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(ev.allowedDepartments &&
                        ev.allowedDepartments.length > 0
                          ? ev.allowedDepartments
                          : ['ALL']
                        ).map((deptName) => (
                          <span
                            key={deptName}
                            className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
                          >
                            ✓ {deptName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL THÊM THÀNH VIÊN VÀO PHÒNG BAN */}
      {assignMemberModalDept && canCreateOrEditOrg && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-xl p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black">
                  {t.addMemberBtn}: {assignMemberModalDept.departmentName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignMemberModalDept(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={assignMemberSearch}
                onChange={(e) => setAssignMemberSearch(e.target.value)}
                placeholder={t.searchEmpPlaceholder}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredAssignCandidates.map((person) => {
                const isAlreadyInThisDept =
                  assignMemberModalDept.memberEmails.some(
                    (em) =>
                      em.trim().toLowerCase() ===
                      person.userEmail.trim().toLowerCase()
                  ) ||
                  person.departmentName.trim().toLowerCase() ===
                    assignMemberModalDept.departmentName.trim().toLowerCase();

                const hasAnotherDept =
                  !isAlreadyInThisDept &&
                  person.departmentName &&
                  person.departmentName !== 'Chưa phân bổ';

                const isDisabled = isAlreadyInThisDept || Boolean(hasAnotherDept);

                return (
                  <div
                    key={person.userEmail}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                      isDisabled
                        ? isDark
                          ? 'bg-slate-950/35 border-slate-800/70 text-slate-500 opacity-55 cursor-not-allowed'
                          : 'bg-slate-100/80 border-slate-200/70 text-slate-400 opacity-60 cursor-not-allowed'
                        : isDark
                        ? 'bg-slate-950 border-slate-800 hover:border-indigo-500/40'
                        : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold">
                          {formatPersonDisplayNameForLocale(
                            person.fullName,
                            webLanguage
                          )}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-500">
                          {person.role}
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5">
                        {person.userEmail} •{' '}
                        <strong>
                          {person.departmentName || 'Chưa phân bổ'}
                        </strong>
                      </p>
                    </div>

                    {isAlreadyInThisDept ? (
                      <span className="px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t.joinedBadge}
                      </span>
                    ) : hasAnotherDept ? (
                      <span className="px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-slate-300/50 dark:bg-slate-800 text-slate-500 flex items-center gap-1 shrink-0">
                        <Lock className="w-3 h-3" />
                        {t.lockedOtherDeptLabel(person.departmentName)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onAssignUserSingleDepartment(
                            person.userEmail,
                            assignMemberModalDept.departmentName
                          );
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{t.addMemberBtn}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAssignMemberModalDept(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO / SỬA PHÒNG BAN */}
      {isDeptModalOpen && canCreateOrEditOrg && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveDepartmentForm}
            className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black">{t.createDeptBtn}</h3>
              <button
                type="button"
                onClick={() => setIsDeptModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1">
                  {t.modalDeptCodeLabel}
                </label>
                <input
                  type="text"
                  required
                  value={deptCodeInput}
                  onChange={(e) => setDeptCodeInput(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                    isDark
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">
                  {t.modalDeptNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={deptNameInput}
                  onChange={(e) => setDeptNameInput(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                    isDark
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1">
                  {t.managerLabel}
                </label>
                <select
                  value={deptManagerEmailInput}
                  onChange={(e) => setDeptManagerEmailInput(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {allCompanyMembers.map((mem) => (
                    <option key={mem.userEmail} value={mem.userEmail}>
                      {formatPersonDisplayNameForLocale(
                        mem.fullName,
                        webLanguage
                      )}{' '}
                      ({mem.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">
                  {t.floorZoneLabel}
                </label>
                <select
                  value={deptFloorInput}
                  onChange={(e) => setDeptFloorInput(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {STANDARD_FLOOR_LOCATIONS.map((fl) => (
                    <option key={fl} value={fl}>
                      {formatFloorLocationForLocale(fl, webLanguage)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <textarea
                rows={3}
                value={deptDescInput}
                onChange={(e) => setDeptDescInput(e.target.value)}
                placeholder={t.modalDeptDescPlaceholder}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs ${
                  isDark
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md"
              >
                {t.saveBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL TẠO / SỬA NHÓM CHUYÊN BIỆT */}
      {isGroupModalOpen && canCreateOrEditOrg && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveGroupForm}
            className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black">{t.createGroupBtn}</h3>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1">
                  {t.modalGroupCodeLabel}
                </label>
                <input
                  type="text"
                  required
                  value={grpCodeInput}
                  onChange={(e) => setGrpCodeInput(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                    isDark
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">
                  {t.modalGroupDeptLabel}
                </label>
                <select
                  value={grpDeptInput}
                  onChange={(e) => {
                    const nextDept = e.target.value;
                    setGrpDeptInput(nextDept);
                    const firstInDept = allCompanyMembers.find(
                      (m) =>
                        m.departmentName.trim().toLowerCase() ===
                        nextDept.trim().toLowerCase()
                    );
                    if (firstInDept) {
                      setGrpLeaderEmailInput(firstInDept.userEmail);
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {departmentsList.map((d) => (
                    <option key={d.departmentId} value={d.departmentName}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <input
                type="text"
                required
                value={grpNameInput}
                onChange={(e) => setGrpNameInput(e.target.value)}
                placeholder={t.modalGroupNamePlaceholder}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                  isDark
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <select
                  value={grpLeaderEmailInput}
                  onChange={(e) => setGrpLeaderEmailInput(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {eligibleGroupLeaders.map((mem) => (
                    <option key={mem.userEmail} value={mem.userEmail}>
                      {formatPersonDisplayNameForLocale(
                        mem.fullName,
                        webLanguage
                      )}{' '}
                      ({mem.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="text"
                  value={grpTagInput}
                  onChange={(e) => setGrpTagInput(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                    isDark
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold shadow-md"
              >
                {t.saveBtn}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};