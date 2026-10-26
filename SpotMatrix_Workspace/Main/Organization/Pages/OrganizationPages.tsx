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
  Eye,
} from 'lucide-react';
import {
  BookingPayloadItem,
  OrganizationDepartmentItem,
  OrganizationGroupItem,
  UserRoleType,
  UserTrustProfileItem,
} from '../../../Shared/Types/GlobalSystemTypes';
import { DepartmentGroupsPanel } from '../Groups/DepartmentGroupsPanel';

export interface OrganizationPagesProps {
  departmentsList: OrganizationDepartmentItem[];
  groupsList: OrganizationGroupItem[];
  trustProfiles: UserTrustProfileItem[];
  bookingsList: BookingPayloadItem[];
  userEmail: string;
  userRole: UserRoleType;
  userDepartment: string;
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

// Danh mục nhân sự mở rộng của công ty để chọn Quản lý / Thêm thành viên thực tế
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

export const OrganizationPages: React.FC<OrganizationPagesProps> = ({
  departmentsList,
  groupsList,
  trustProfiles,
  bookingsList,
  userEmail,
  userRole,
  userDepartment,
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

  const [activeTab, setActiveTab] = useState<'DEPARTMENTS' | 'MEMBER_MATRIX'>(
    'DEPARTMENTS'
  );
  const [deptSearchQuery, setDeptSearchQuery] = useState<string>('');
  const [selectedDetailDeptId, setSelectedDetailDeptId] = useState<string>(
    departmentsList[0]?.departmentId || 'DEPT-GOV-01'
  );
  const [detailEmployeeSearch, setDetailEmployeeSearch] = useState<string>('');

  // Hợp nhất danh bạ nhân sự từ trustProfiles + danh bạ mở rộng
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

  // Danh sách nhân sự hiển thị theo Role: Admin thấy tất cả (bao gồm chính mình), Role khác KHÔNG thấy SYS_ADMIN
  const roleFilteredCompanyMembers = useMemo(() => {
    return allCompanyMembers.filter(
      (m) => isSysAdmin || m.role !== 'SYS_ADMIN'
    );
  }, [allCompanyMembers, isSysAdmin]);

  // Lọc Phòng ban theo Role + Thanh tìm kiếm
  const visibleDepartments = useMemo(() => {
    const q = deptSearchQuery.trim().toLowerCase();
    return departmentsList.filter((dept) => {
      if (!isSysAdmin) {
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
  }, [departmentsList, isSysAdmin, userDepartment, userEmail, deptSearchQuery]);

  // Phòng ban đang được bấm chọn để xem chi tiết Nhân viên & Nhóm con
  const activeDetailDepartment = useMemo(() => {
    return (
      visibleDepartments.find((d) => d.departmentId === selectedDetailDeptId) ||
      visibleDepartments[0] ||
      null
    );
  }, [visibleDepartments, selectedDetailDeptId]);

  // ============================================================================
  // MODAL 1: TẠO / CHỈNH SỬA PHÒNG BAN (CHỌN QUẢN LÝ & TẦNG TỪ DROPDOWN)
  // ============================================================================
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
    if (!deptNameInput.trim()) return;

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
    setSelectedDetailDeptId(payload.departmentId);
    setIsDeptModalOpen(false);
  };

  // ============================================================================
  // MODAL 2: TẠO / CHỈNH SỬA NHÓM CON THUỘC PHÒNG BAN (CHỌN TRƯỞNG NHÓM TỪ DANH SÁCH)
  // ============================================================================
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
    const targetDeptName =
      preselectedDeptName ||
      activeDetailDepartment?.departmentName ||
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
    if (!grpNameInput.trim()) return;

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

  // ============================================================================
  // MODAL 3: CHỦ ĐỘNG "+ THÊM THÀNH VIÊN VÀO PHÒNG BAN" (LÀM XÁM NGƯỜI ĐÃ CÓ PHÒNG BAN)
  // ============================================================================
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
            <h1 className="text-lg font-black tracking-tight">
              Cơ cấu Tổ chức — Quản lý Phòng ban & Các Nhóm Chuyên biệt Trực thuộc
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                isSysAdmin
                  ? 'bg-indigo-600 text-white'
                  : 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
              }`}
            >
              {isSysAdmin
                ? 'SYS_ADMIN • Toàn quyền Tạo / Sửa / Xóa & Xem Tất cả'
                : `${userRole} • Chỉ hiển thị Phòng ban & Nhóm của bạn`}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Bấm vào từng ô Phòng ban để xem danh sách Nhân viên và các Nhóm chuyên biệt con bên trong • Một người chỉ thuộc duy nhất 1 Phòng ban.
          </p>
        </div>

        {/* Nút Chuyển Tab: Tab "Liên kết Thành viên & Sự kiện Hội trường" CHỈ HIỂN THỊ CHO SYS_ADMIN */}
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
            <span>
              Phòng ban & Nhóm Trực thuộc ({visibleDepartments.length})
            </span>
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
              <span>Liên kết Thành viên & Sự kiện Hội trường (Admin)</span>
            </button>
          )}
        </div>
      </div>

      {/* Thanh Trạng thái Cá nhân & Tìm kiếm Phòng ban */}
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
              Tài khoản đang đăng nhập:{' '}
            </span>
            <strong>{userEmail}</strong>
            <span className="mx-2 text-slate-400">•</span>
            <span className="text-slate-500 dark:text-slate-400">
              Phòng ban duy nhất của bạn:{' '}
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
              placeholder="Tìm phòng ban, mã, quản lý..."
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

          {isSysAdmin && (
            <>
              <button
                type="button"
                onClick={openCreateDepartmentModal}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo Phòng ban Mới</span>
              </button>
              <button
                type="button"
                onClick={() => openCreateGroupModal()}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo Nhóm Mới</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* TAB 1: DANH SÁCH Ô PHÒNG BAN & BẢNG CHI TIẾT PHÒNG BAN (NHÂN VIÊN + CÁC NHÓM CON) */}
      {activeTab === 'DEPARTMENTS' && (
        <div className="space-y-6">
          {/* Lưới các Ô Phòng ban: Click vào ô nào sẽ mở chi tiết Nhân sự & Nhóm của Phòng ban đó */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {visibleDepartments.map((dept) => {
              const isSelectedCard =
                activeDetailDepartment?.departmentId === dept.departmentId;

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
                  onClick={() => setSelectedDetailDeptId(dept.departmentId)}
                  className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 cursor-pointer transition-all ${
                    isSelectedCard
                      ? isDark
                        ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                        : 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-lg'
                      : isDark
                      ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-indigo-100/80 hover:border-indigo-300 shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-indigo-600 text-white">
                            {dept.departmentCode}
                          </span>
                          <h3 className="text-base font-black">
                            {dept.departmentName}
                          </h3>
                          {isSelectedCard && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-teal-500/15 text-teal-600 dark:text-teal-300 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              Đang xem chi tiết
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {dept.description}
                        </p>
                      </div>

                      {isSysAdmin && (
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => openEditDepartmentModal(dept)}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Chỉnh sửa Phòng ban"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onDeleteDepartment(dept.departmentId)
                            }
                            className="p-2 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                            title="Xóa Phòng ban"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
                          Quản lý Phụ trách:
                        </span>
                        <strong className="font-bold">
                          {dept.managerName}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Khu vực Tầng Hoạt động:
                        </span>
                        <strong className="font-bold text-indigo-500">
                          {dept.floorLocation}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3 text-xs font-extrabold">
                        <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                          <Users className="w-3.5 h-3.5" />
                          {deptMembers.length} nhân sự
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">
                          •
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                          <Layers className="w-3.5 h-3.5" />
                          {subGroupsCount} nhóm chuyên biệt
                        </span>
                      </div>

                      {isSysAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignMemberModalDept(dept);
                            setAssignMemberSearch('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>+ Thêm Thành viên</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BẢNG CHI TIẾT PHÒNG BAN ĐANG CHỌN: HIỂN THỊ NHÂN VIÊN TRONG PHÒNG BAN & CÁC NHÓM CON */}
          {activeDetailDepartment && (
            <div
              className={`p-6 rounded-3xl border space-y-6 ${
                isDark
                  ? 'bg-slate-900/95 border-indigo-500/40 shadow-xl'
                  : 'bg-white border-indigo-200 shadow-md'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-indigo-600 text-white">
                      CHI TIẾT PHÒNG BAN
                    </span>
                    <h3 className="text-base font-black">
                      {activeDetailDepartment.departmentName} (
                      {activeDetailDepartment.departmentCode})
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Quản lý: <strong>{activeDetailDepartment.managerName}</strong> • Tầng hoạt động:{' '}
                    <strong className="text-indigo-500">
                      {activeDetailDepartment.floorLocation}
                    </strong>
                  </p>
                </div>

                {isSysAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setAssignMemberModalDept(activeDetailDepartment);
                      setAssignMemberSearch('');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Thêm Thành viên từ Danh sách Công ty</span>
                  </button>
                )}
              </div>

              {/* PHẦN A: DANH SÁCH NHÂN SỰ TRỰC THUỘC PHÒNG BAN NÀY */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    1. Danh sách Nhân viên thuộc Phòng ban “
                    {activeDetailDepartment.departmentName}”
                  </h4>

                  <div className="relative w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={detailEmployeeSearch}
                      onChange={(e) => setDetailEmployeeSearch(e.target.value)}
                      placeholder="Tìm nhân viên trong phòng ban..."
                      className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs font-semibold outline-none ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {roleFilteredCompanyMembers
                    .filter((m) => {
                      const inThisDept =
                        activeDetailDepartment.memberEmails.some(
                          (em) =>
                            em.trim().toLowerCase() ===
                            m.userEmail.trim().toLowerCase()
                        ) ||
                        m.departmentName.trim().toLowerCase() ===
                          activeDetailDepartment.departmentName
                            .trim()
                            .toLowerCase();
                      if (!inThisDept) return false;
                      const q = detailEmployeeSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        m.fullName.toLowerCase().includes(q) ||
                        m.userEmail.toLowerCase().includes(q) ||
                        m.role.toLowerCase().includes(q)
                      );
                    })
                    .map((emp) => {
                      const empGroups = groupsList.filter(
                        (g) =>
                          g.departmentName.trim().toLowerCase() ===
                            activeDetailDepartment.departmentName
                              .trim()
                              .toLowerCase() &&
                          g.memberEmails.some(
                            (em) =>
                              em.trim().toLowerCase() ===
                              emp.userEmail.trim().toLowerCase()
                          )
                      );

                      return (
                        <div
                          key={emp.userEmail}
                          className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2 ${
                            isDark
                              ? 'bg-slate-950 border-slate-800'
                              : 'bg-slate-50 border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-extrabold truncate">
                                  {emp.fullName}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[9px] font-black ${
                                    emp.role === 'SYS_ADMIN'
                                      ? 'bg-rose-500/15 text-rose-500'
                                      : emp.role === 'MANAGER'
                                      ? 'bg-indigo-500/15 text-indigo-500'
                                      : 'bg-teal-500/15 text-teal-600'
                                  }`}
                                >
                                  {emp.role}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {emp.userEmail}
                              </p>
                            </div>

                            {isSysAdmin && (
                              <button
                                type="button"
                                onClick={() =>
                                  onAssignUserSingleDepartment(
                                    emp.userEmail,
                                    'Chưa phân bổ'
                                  )
                                }
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                                title="Gỡ nhân sự khỏi phòng ban này (về trạng thái Chưa phân bổ)"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-slate-400">
                              Nhóm tham gia ({empGroups.length}):
                            </span>
                            {empGroups.length === 0 ? (
                              <span className="text-[10px] italic text-slate-400">
                                Chưa vào nhóm
                              </span>
                            ) : (
                              empGroups.map((eg) => (
                                <span
                                  key={eg.groupId}
                                  className="px-2 py-0.5 rounded text-[9px] font-bold bg-teal-500/15 text-teal-600 dark:text-teal-300"
                                >
                                  {eg.groupCode}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* PHẦN B: DANH SÁCH CÁC NHÓM CHUYÊN BIỆT TRỰC THUỘC PHÒNG BAN NÀY (THƯ MỤC GROUPS RIÊNG) */}
              <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800">
                <DepartmentGroupsPanel
                  parentDepartment={activeDetailDepartment}
                  groupsList={groupsList}
                  allMembers={allCompanyMembers}
                  userEmail={userEmail}
                  userRole={userRole}
                  isDark={isDark}
                  onOpenCreateGroupForDept={(deptName) =>
                    openCreateGroupModal(deptName)
                  }
                  onOpenEditGroup={openEditGroupModal}
                  onDeleteGroup={onDeleteGroup}
                  onToggleGroupMember={onToggleGroupMember}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2 (CHỈ DÀNH RIÊNG CHO SYS_ADMIN): MA TRẬN LIÊN KẾT THÀNH VIÊN & SỰ KIỆN HỘI TRƯỜNG */}
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
              <h3 className="text-sm font-black">
                Bảng Kiểm chứng Quan hệ: 1 Phòng ban Duy nhất & Đa Nhóm Chuyên biệt (SYS_ADMIN)
              </h3>
              <p className="text-xs text-slate-400">
                Chỉ System Admin mới nhìn thấy bảng điều phối tổng thể này.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 uppercase">
                    <th className="py-2.5 pr-3">Nhân sự</th>
                    <th className="py-2.5 px-3">Vai trò</th>
                    <th className="py-2.5 px-3">Phòng ban Duy nhất (1)</th>
                    <th className="py-2.5 pl-3">
                      Các Nhóm Tham gia (Cùng Phòng ban)
                    </th>
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
                          <p className="font-extrabold">{tp.fullName}</p>
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
                              -- Chưa phân bổ phòng ban --
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
                                Chưa tham gia nhóm
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
                  Sự kiện Hội trường Tầng 5 (H-01) & Phân quyền Phòng ban
                </h3>
              </div>
              {onNavigateToHallBooking && (
                <button
                  type="button"
                  onClick={onNavigateToHallBooking}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold"
                >
                  Đến Hội trường
                </button>
              )}
            </div>

            <div className="space-y-3">
              {hallEventsList.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-xs text-slate-400 text-center">
                  Hiện chưa có sự kiện thuê Hội trường (H-01) nào.
                </div>
              ) : (
                hallEventsList.map((ev) => (
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
                        {ev.bookingDateIso || 'Hôm nay'} ({ev.startTimeIso} –{' '}
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
                          ? 'ĐÃ PHÊ DUYỆT THUÊ'
                          : 'CHỜ ADMIN DUYỆT'}
                      </span>
                    </div>
                    <p className="text-xs font-bold">{ev.purposeNote}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(ev.allowedDepartments &&
                      ev.allowedDepartments.length > 0
                        ? ev.allowedDepartments
                        : ['Tất cả các Phòng ban']
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
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHỦ ĐỘNG "+ THÊM THÀNH VIÊN VÀO PHÒNG BAN" (AI ĐÃ CÓ PHÒNG BAN THÌ XÁM NHẠT KHÔNG THỂ CHỈ ĐỊNH) */}
      {assignMemberModalDept && isSysAdmin && (
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
                  Thêm Thành viên vào Phòng ban:{' '}
                  {assignMemberModalDept.departmentName}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Quy tắc: Mỗi nhân sự chỉ thuộc duy nhất 1 Phòng ban. Những
                  người đã thuộc phòng ban khác sẽ hiện màu xám nhạt (không thể
                  chỉ định trùng).
                </p>
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
                placeholder="Tìm kiếm nhân sự theo tên, email hoặc trạng thái phòng ban..."
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
                          {person.fullName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-500">
                          {person.role}
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5">
                        {person.userEmail} • Hiện tại:{' '}
                        <strong>
                          {person.departmentName || 'Chưa phân bổ'}
                        </strong>
                      </p>
                    </div>

                    {isAlreadyInThisDept ? (
                      <span className="px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã ở Phòng ban này
                      </span>
                    ) : hasAnotherDept ? (
                      <span className="px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-slate-300/50 dark:bg-slate-800 text-slate-500 flex items-center gap-1 shrink-0">
                        <Lock className="w-3 h-3" />
                        Không thể chỉ định (Đã thuộc {person.departmentName})
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
                        <span>Chỉ định vào Phòng ban</span>
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
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO / SỬA PHÒNG BAN: CHỌN NGƯỜI QUẢN LÝ & TẦNG HOẠT ĐỘNG TỪ DANH SÁCH */}
      {isDeptModalOpen && (
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
              <h3 className="text-base font-black">
                {editingDept
                  ? 'Chỉnh sửa Phòng ban Tổ chức'
                  : 'Thiết lập Phòng ban Tổ chức Mới'}
              </h3>
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
                  Mã Phòng ban
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
                  Tên Phòng ban
                </label>
                <input
                  type="text"
                  required
                  value={deptNameInput}
                  onChange={(e) => setDeptNameInput(e.target.value)}
                  placeholder="VD: Cloud & DevSecOps"
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
                  Chọn Người Quản lý (Từ Danh sách)
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
                      {mem.fullName} ({mem.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">
                  Chọn Tầng Hoạt động Chính
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
                      {fl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">
                Mô tả chức năng nhiệm vụ
              </label>
              <textarea
                rows={3}
                value={deptDescInput}
                onChange={(e) => setDeptDescInput(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs ${
                  isDark
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeptModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md"
              >
                Lưu Phòng ban lên Database
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL TẠO / SỬA NHÓM CON: CHỌN PHÒNG BAN CHỦ QUẢN & CHỌN TRƯỞNG NHÓM TỪ DANH SÁCH */}
      {isGroupModalOpen && (
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
              <h3 className="text-base font-black">
                {editingGroup
                  ? 'Chỉnh sửa Nhóm Chuyên biệt'
                  : 'Tạo Nhóm Chuyên biệt Trực thuộc Phòng ban'}
              </h3>
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
                <label className="text-xs font-bold block mb-1">Mã Nhóm</label>
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
                  Thuộc Phòng ban Chủ quản
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
              <label className="text-xs font-bold block mb-1">
                Tên Nhóm Chuyên biệt / Dự án
              </label>
              <input
                type="text"
                required
                value={grpNameInput}
                onChange={(e) => setGrpNameInput(e.target.value)}
                placeholder="VD: Nhóm Tối ưu Không gian 3D & AI"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                  isDark
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1">
                  Chọn Trưởng nhóm (Từ Phòng ban)
                </label>
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
                      {mem.fullName} ({mem.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">
                  Tag Dự án
                </label>
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

            <div>
              <label className="text-xs font-bold block mb-1">
                Mô tả nhiệm vụ của nhóm
              </label>
              <textarea
                rows={2}
                value={grpDescInput}
                onChange={(e) => setGrpDescInput(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs ${
                  isDark
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold shadow-md"
              >
                Lưu Nhóm lên Database
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};