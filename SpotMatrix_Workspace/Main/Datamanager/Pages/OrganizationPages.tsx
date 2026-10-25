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
  UserCheck,
  Sparkles,
  Calendar,
  X,
  ArrowRightLeft,
} from 'lucide-react';
import {
  BookingPayloadItem,
  OrganizationDepartmentItem,
  OrganizationGroupItem,
  UserRoleType,
  UserTrustProfileItem,
} from '../../../Shared/Types/GlobalSystemTypes';

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
  const isAdmin = userRole === 'SYS_ADMIN';
  const normalizedMyEmail = (userEmail || '').trim().toLowerCase();

  const [activeSubTab, setActiveSubTab] = useState<
    'DEPARTMENTS' | 'GROUPS' | 'MEMBER_MATRIX'
  >('DEPARTMENTS');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const [editingDept, setEditingDept] =
    useState<OrganizationDepartmentItem | null>(null);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState<boolean>(false);

  const [editingGroup, setEditingGroup] =
    useState<OrganizationGroupItem | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);

  const triggerBanner = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 4000);
  };

  // Phân quyền hiển thị:
  // - SYS_ADMIN: Nhìn thấy toàn bộ Phòng ban và toàn bộ Nhóm hiện có.
  // - MANAGER & EMPLOYEE: Chỉ nhìn thấy duy nhất Phòng ban của mình và các Nhóm mà mình đang tham gia.
  const visibleDepartments = useMemo(() => {
    if (isAdmin) return departmentsList;
    return departmentsList.filter(
      (d) =>
        d.departmentName.trim().toLowerCase() ===
          (userDepartment || '').trim().toLowerCase() ||
        d.memberEmails.some((em) => em.trim().toLowerCase() === normalizedMyEmail)
    );
  }, [isAdmin, departmentsList, userDepartment, normalizedMyEmail]);

  const visibleGroups = useMemo(() => {
    if (isAdmin) return groupsList;
    return groupsList.filter((g) =>
      g.memberEmails.some((em) => em.trim().toLowerCase() === normalizedMyEmail)
    );
  }, [isAdmin, groupsList, normalizedMyEmail]);

  const activeHallEvents = useMemo(() => {
    return bookingsList.filter(
      (b) =>
        (b.nodeId === 'H-01' || b.bookingMode === 'HALL_EVENT_RENTAL') &&
        b.bookingStatus !== 'CANCELLED' &&
        b.approvalStatus !== 'REJECTED'
    );
  }, [bookingsList]);

  const handleOpenCreateDept = () => {
    setEditingDept({
      departmentId: `DEPT-${Date.now().toString().slice(-4)}`,
      departmentCode: 'NEW-DEPT',
      departmentName: '',
      description: '',
      managerEmail: 'manager.lead@spotmatrix.vn',
      managerName: 'Lê Thu Hà (Quản lý)',
      floorLocation: 'Tầng 2',
      colorBadge: 'INDIGO',
      memberEmails: [],
      updatedAtIso: new Date().toISOString(),
    });
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: OrganizationDepartmentItem) => {
    setEditingDept({ ...dept });
    setIsDeptModalOpen(true);
  };

  const handleSaveDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editingDept.departmentName.trim()) return;
    onUpsertDepartment(editingDept);
    setIsDeptModalOpen(false);
    setEditingDept(null);
    triggerBanner(
      `Đã lưu thông tin Phòng ban "${editingDept.departmentName}" và đồng bộ lên MongoDB Atlas!`
    );
  };

  const handleOpenCreateGroup = () => {
    setEditingGroup({
      groupId: `GRP-${Date.now().toString().slice(-4)}`,
      groupCode: 'SQUAD-NEW',
      groupName: '',
      departmentName:
        departmentsList[0]?.departmentName || 'Product & Engineering',
      description: '',
      leaderEmail: 'manager.lead@spotmatrix.vn',
      leaderName: 'Lê Thu Hà (Quản lý)',
      projectTag: 'SpotMatrix Project',
      memberEmails: [userEmail],
      updatedAtIso: new Date().toISOString(),
    });
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroup = (grp: OrganizationGroupItem) => {
    setEditingGroup({ ...grp });
    setIsGroupModalOpen(true);
  };

  const handleSaveGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !editingGroup.groupName.trim()) return;
    onUpsertGroup(editingGroup);
    setIsGroupModalOpen(false);
    setEditingGroup(null);
    triggerBanner(
      `Đã lưu thông tin Nhóm "${editingGroup.groupName}" và đồng bộ lên MongoDB Atlas!`
    );
  };

  return (
    <div className="space-y-6">
      <div
        className={`p-6 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              isDark
                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                : 'bg-indigo-50 border-indigo-100 text-indigo-600'
            }`}
          >
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className={`text-lg font-extrabold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Cơ cấu Tổ chức — Quản lý Phòng ban & Nhóm Chuyên môn
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                  isAdmin
                    ? 'bg-indigo-600 text-white'
                    : 'bg-teal-500/15 text-teal-600 dark:text-teal-300'
                }`}
              >
                {isAdmin
                  ? 'SYS_ADMIN • Toàn quyền Tạo / Sửa / Xóa & Xem Tất cả'
                  : `${userRole} • Chỉ xem Phòng ban & Nhóm của bạn`}
              </span>
            </div>
            <p
              className={`text-xs mt-0.5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Quy tắc dữ liệu chuẩn: Mỗi nhân sự thuộc <strong>duy nhất 1 Phòng ban</strong> (liên kết quyền đặt ghế Hội trường Tầng 5), nhưng có thể tham gia <strong>nhiều Nhóm chuyên môn</strong>.
            </p>
          </div>
        </div>

        <div
          className={`p-1 rounded-2xl border flex flex-wrap items-center gap-1 ${
            isDark
              ? 'bg-slate-950 border-slate-800'
              : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveSubTab('DEPARTMENTS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
              activeSubTab === 'DEPARTMENTS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Phòng ban ({visibleDepartments.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('GROUPS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
              activeSubTab === 'GROUPS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Nhóm Công tác ({visibleGroups.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('MEMBER_MATRIX')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
              activeSubTab === 'MEMBER_MATRIX'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Liên kết Thành viên & Sự kiện Hội trường
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="p-3.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-300 text-xs font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-[11px] underline"
          >
            Đóng
          </button>
        </div>
      )}

      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isDark
            ? 'bg-slate-950/90 border-slate-800 text-slate-200'
            : 'bg-indigo-50/60 border-indigo-100 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-3 text-xs">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <span>
              Tài khoản đang đăng nhập: <strong>{userEmail}</strong> • Phòng ban duy nhất của bạn:{' '}
              <strong className="px-2 py-0.5 rounded bg-indigo-600 text-white">
                {userDepartment}
              </strong>
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Số nhóm bạn đang tham gia:{' '}
              <strong>
                {
                  groupsList.filter((g) =>
                    g.memberEmails.some(
                      (em) => em.trim().toLowerCase() === normalizedMyEmail
                    )
                  ).length
                }{' '}
                nhóm
              </strong>{' '}
              (
              {groupsList
                .filter((g) =>
                  g.memberEmails.some(
                    (em) => em.trim().toLowerCase() === normalizedMyEmail
                  )
                )
                .map((g) => g.groupName)
                .join(', ') || 'Chưa tham gia nhóm nào'}
              )
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCreateDept}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo Phòng ban Mới
            </button>
            <button
              type="button"
              onClick={handleOpenCreateGroup}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo Nhóm Mới
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: DANH SÁCH PHÒNG BAN */}
      {activeSubTab === 'DEPARTMENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {visibleDepartments.map((dept) => {
            const isMyDept =
              dept.departmentName.trim().toLowerCase() ===
              (userDepartment || '').trim().toLowerCase();
            const deptGroupsCount = groupsList.filter(
              (g) =>
                g.departmentName.trim().toLowerCase() ===
                dept.departmentName.trim().toLowerCase()
            ).length;

            return (
              <div
                key={dept.departmentId}
                className={`p-5 rounded-3xl border flex flex-col justify-between gap-4 transition ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800'
                    : 'bg-white border-indigo-100/80 shadow-sm'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-indigo-600 text-white">
                          {dept.departmentCode}
                        </span>
                        <h2
                          className={`text-base font-extrabold ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {dept.departmentName}
                        </h2>
                        {isMyDept && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-teal-500/15 text-teal-600 dark:text-teal-300">
                            Phòng ban của bạn
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {dept.description}
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditDept(dept)}
                          className={`p-2 rounded-xl border transition ${
                            isDark
                              ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-400'
                          }`}
                          title="Chỉnh sửa Phòng ban"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {departmentsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteDepartment(dept.departmentId);
                              triggerBanner(
                                `Đã xóa Phòng ban "${dept.departmentName}" khỏi hệ thống.`
                              );
                            }}
                            className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition"
                            title="Xóa Phòng ban"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border grid grid-cols-2 gap-2 text-xs ${
                      isDark
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-50/80 border-slate-200/70'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Quản lý Phụ trách:
                      </span>
                      <strong
                        className={isDark ? 'text-slate-200' : 'text-slate-800'}
                      >
                        {dept.managerName}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Khu vực Tầng Ưu tiên:
                      </span>
                      <strong className="text-indigo-600 dark:text-indigo-400">
                        {dept.floorLocation}
                      </strong>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="text-slate-400">
                        Nhân sự trực thuộc ({dept.memberEmails.length} người •{' '}
                        {deptGroupsCount} nhóm trực thuộc):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {dept.memberEmails.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">
                          Chưa có thành viên nào trong phòng ban này.
                        </span>
                      ) : (
                        dept.memberEmails.map((em) => {
                          const profile = trustProfiles.find(
                            (p) =>
                              p.userEmail.toLowerCase() === em.toLowerCase()
                          );
                          return (
                            <span
                              key={em}
                              className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 ${
                                isDark
                                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                                  : 'bg-indigo-50/70 border-indigo-100 text-indigo-900'
                              }`}
                            >
                              <UserCheck className="w-3 h-3 text-teal-500" />
                              <span>{profile ? profile.fullName : em}</span>
                              <span className="text-[9px] opacity-60">
                                ({profile?.role || 'MEMBER'})
                              </span>
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-400">
                      Chuyển nhân sự về Phòng ban này:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {trustProfiles.map((tp) => {
                        const alreadyInDept = dept.memberEmails.some(
                          (em) =>
                            em.toLowerCase() === tp.userEmail.toLowerCase()
                        );
                        return (
                          <button
                            key={tp.userEmail}
                            type="button"
                            disabled={alreadyInDept}
                            onClick={() => {
                              onAssignUserSingleDepartment(
                                tp.userEmail,
                                dept.departmentName
                              );
                              triggerBanner(
                                `Đã chuyển ${tp.fullName} sang Phòng ban duy nhất "${dept.departmentName}" và đồng bộ toàn hệ thống!`
                              );
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition ${
                              alreadyInDept
                                ? 'bg-teal-500/15 border-teal-500/30 text-teal-600 cursor-default'
                                : isDark
                                ? 'bg-slate-950 border-slate-700 text-slate-300 hover:border-indigo-500'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400'
                            }`}
                          >
                            {alreadyInDept
                              ? `✓ ${tp.fullName.split(' ')[0]}`
                              : `+ Chuyển ${tp.fullName.split(' ')[0]}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: DANH SÁCH NHÓM CHUYÊN MÔN */}
      {activeSubTab === 'GROUPS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleGroups.length === 0 ? (
            <div
              className={`col-span-full p-8 rounded-3xl border text-center space-y-2 ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <Users className="w-8 h-8 text-indigo-500 mx-auto" />
              <p className="text-sm font-extrabold">
                Bạn hiện chưa tham gia Nhóm chuyên môn nào
              </p>
              <p className="text-xs text-slate-400">
                Liên hệ Quản trị viên (SYS_ADMIN) để được thêm vào các Nhóm dự án phù hợp.
              </p>
            </div>
          ) : (
            visibleGroups.map((grp) => {
              const isMeInGroup = grp.memberEmails.some(
                (em) => em.trim().toLowerCase() === normalizedMyEmail
              );
              return (
                <div
                  key={grp.groupId}
                  className={`p-5 rounded-3xl border flex flex-col justify-between gap-4 ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800'
                      : 'bg-white border-indigo-100/80 shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-teal-600 text-white">
                            {grp.groupCode}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                            {grp.departmentName}
                          </span>
                          {isMeInGroup && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/15 text-amber-600">
                              Nhóm của bạn
                            </span>
                          )}
                        </div>
                        <h3
                          className={`text-sm font-extrabold mt-2 ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {grp.groupName}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {grp.description}
                        </p>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditGroup(grp)}
                            className={`p-1.5 rounded-lg border transition ${
                              isDark
                                ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-400'
                            }`}
                            title="Sửa Nhóm"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteGroup(grp.groupId);
                              triggerBanner(
                                `Đã xóa Nhóm "${grp.groupName}" thành công.`
                              );
                            }}
                            className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition"
                            title="Xóa Nhóm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div
                      className={`p-3 rounded-2xl border text-xs space-y-1 ${
                        isDark
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-slate-50 border-slate-200/70'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="text-slate-400">Trưởng nhóm:</span>
                        <strong
                          className={
                            isDark ? 'text-slate-200' : 'text-slate-800'
                          }
                        >
                          {grp.leaderName}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Chuyên đề / Tag:</span>
                        <strong className="text-teal-600 dark:text-teal-400">
                          {grp.projectTag}
                        </strong>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                        Thành viên trong nhóm ({grp.memberEmails.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {grp.memberEmails.map((em) => {
                          const pf = trustProfiles.find(
                            (p) =>
                              p.userEmail.toLowerCase() === em.toLowerCase()
                          );
                          return (
                            <span
                              key={em}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${
                                isDark
                                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              {pf ? pf.fullName : em}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 block">
                        Thêm / Gỡ thành viên (Hỗ trợ 1 người ở nhiều Nhóm):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {trustProfiles.map((tp) => {
                          const isMember = grp.memberEmails.some(
                            (em) =>
                              em.toLowerCase() === tp.userEmail.toLowerCase()
                          );
                          return (
                            <button
                              key={tp.userEmail}
                              type="button"
                              onClick={() => {
                                onToggleGroupMember(grp.groupId, tp.userEmail);
                                triggerBanner(
                                  `${
                                    isMember ? 'Đã gỡ' : 'Đã thêm'
                                  } ${tp.fullName} ${
                                    isMember ? 'khỏi' : 'vào'
                                  } nhóm "${grp.groupName}"!`
                                );
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border flex items-center gap-1 transition ${
                                isMember
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : isDark
                                  ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-400'
                              }`}
                            >
                              <UserPlus className="w-3 h-3" />
                              {isMember
                                ? `✓ ${tp.fullName.split(' ')[0]}`
                                : `+ ${tp.fullName.split(' ')[0]}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: MA TRẬN LIÊN KẾT THÀNH VIÊN & SỰ KIỆN HỘI TRƯỜNG */}
      {activeSubTab === 'MEMBER_MATRIX' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div
            className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-indigo-100/80 shadow-sm'
            }`}
          >
            <div>
              <h2
                className={`text-sm font-extrabold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Bảng Kiểm chứng Quan hệ: 1 Phòng ban Duy nhất & Đa Nhóm Công tác
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dữ liệu dưới đây đồng bộ thời gian thực với trang Đặt lịch, Sơ đồ 5 Tầng, Hồ sơ và Cài đặt.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark
                        ? 'border-slate-800 text-slate-400'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    <th className="py-2.5 pr-3">Nhân sự</th>
                    <th className="py-2.5 px-3">Vai trò</th>
                    <th className="py-2.5 px-3">Phòng ban Duy nhất (1)</th>
                    <th className="py-2.5 pl-3">Các Nhóm Tham gia (N)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
                  {trustProfiles
                    .filter(
                      (tp) =>
                        isAdmin ||
                        tp.departmentName.trim().toLowerCase() ===
                          userDepartment.trim().toLowerCase()
                    )
                    .map((tp) => {
                      const memberGroups = groupsList.filter((g) =>
                        g.memberEmails.some(
                          (em) =>
                            em.toLowerCase() === tp.userEmail.toLowerCase()
                        )
                      );
                      return (
                        <tr key={tp.userEmail}>
                          <td className="py-3 pr-3">
                            <p
                              className={`font-extrabold ${
                                isDark ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {tp.fullName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {tp.userEmail}
                            </p>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                              {tp.role}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {isAdmin ? (
                              <select
                                value={tp.departmentName}
                                onChange={(e) => {
                                  onAssignUserSingleDepartment(
                                    tp.userEmail,
                                    e.target.value
                                  );
                                  triggerBanner(
                                    `Đã cập nhật Phòng ban của ${tp.fullName} sang "${e.target.value}"!`
                                  );
                                }}
                                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold outline-none ${
                                  isDark
                                    ? 'bg-slate-950 border-slate-800 text-white'
                                    : 'bg-slate-50 border-slate-200 text-slate-900'
                                }`}
                              >
                                {departmentsList.map((d) => (
                                  <option
                                    key={d.departmentId}
                                    value={d.departmentName}
                                  >
                                    {d.departmentName}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-300 font-bold">
                                {tp.departmentName}
                              </span>
                            )}
                          </td>
                          <td className="py-3 pl-3">
                            <div className="flex flex-wrap gap-1">
                              {memberGroups.length === 0 ? (
                                <span className="text-slate-400 italic">
                                  Chưa có nhóm
                                </span>
                              ) : (
                                memberGroups.map((g) => (
                                  <span
                                    key={g.groupId}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                                  >
                                    {g.groupName}
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
                <Layers className="w-5 h-5 text-amber-500" />
                <h2
                  className={`text-sm font-extrabold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Sự kiện Hội trường Tầng 5 (H-01) & Phân quyền Phòng ban
                </h2>
              </div>
              {onNavigateToHallBooking && (
                <button
                  type="button"
                  onClick={onNavigateToHallBooking}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition"
                >
                  Đến Hội trường
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Khi Admin hoặc Quản lý thuê cả Hội trường (H-01), chỉ các Phòng ban được chọn dưới đây mới có quyền đặt chỗ ghế ngồi (Admin được miễn trừ toàn quyền).
            </p>

            <div className="space-y-3">
              {activeHallEvents.length === 0 ? (
                <div
                  className={`p-4 rounded-2xl border text-xs text-center ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-400'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  Hiện chưa có sự kiện thuê Hội trường (H-01) nào. Nhân viên chưa thể đặt ghế ngồi cho đến khi có sự kiện được phê duyệt.
                </div>
              ) : (
                activeHallEvents.map((ev) => {
                  const allowedList = ev.allowedDepartments || [];
                  const isMyDeptInvited =
                    isAdmin ||
                    allowedList.length === 0 ||
                    allowedList.includes('ALL') ||
                    allowedList.some(
                      (d) =>
                        d.trim().toLowerCase() ===
                        userDepartment.trim().toLowerCase()
                    );

                  return (
                    <div
                      key={ev.bookingId}
                      className={`p-4 rounded-2xl border space-y-2 ${
                        isDark
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-slate-50/80 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-600 text-white">
                          Sự kiện {ev.bookingId}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            ev.approvalStatus === 'APPROVED'
                              ? 'bg-teal-500/15 text-teal-600'
                              : 'bg-amber-500/15 text-amber-600'
                          }`}
                        >
                          {ev.approvalStatus === 'APPROVED'
                            ? 'ĐÃ PHÊ DUYỆT • MỞ ĐẶT GHẾ'
                            : 'CHỜ ADMIN DUYỆT'}
                        </span>
                      </div>

                      <h3
                        className={`text-xs font-extrabold ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {ev.purposeNote}
                      </h3>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>
                          Ngày {ev.bookingDateIso} • Khung giờ: {ev.startTimeIso}{' '}
                          – {ev.endTimeIso}
                        </span>
                      </div>

                      <div className="pt-1">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">
                          Phòng ban được phép đặt ghế tham gia:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {allowedList.length === 0 ||
                          allowedList.includes('ALL') ? (
                            <span className="px-2 py-0.5 rounded bg-teal-500/15 text-teal-600 text-[10px] font-bold">
                              Tất cả các Phòng ban
                            </span>
                          ) : (
                            allowedList.map((deptName) => (
                              <span
                                key={deptName}
                                className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold"
                              >
                                {deptName}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div
                        className={`mt-2 p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${
                          isMyDeptInvited && ev.approvalStatus === 'APPROVED'
                            ? 'bg-teal-500/10 text-teal-600 dark:text-teal-300'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-300'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {ev.approvalStatus !== 'APPROVED'
                            ? 'Sự kiện đang chờ Admin duyệt — Chưa mở đặt ghế.'
                            : isMyDeptInvited
                            ? `Phòng ban của bạn (${userDepartment}) ĐƯỢC PHÉP đặt ghế tham gia!`
                            : `Phòng ban của bạn (${userDepartment}) KHÔNG nằm trong danh sách tham gia sự kiện này.`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {isDeptModalOpen && editingDept && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 space-y-4 shadow-2xl ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold">
                Thiết lập Phòng ban Tổ chức
              </h3>
              <button
                type="button"
                onClick={() => setIsDeptModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeptSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Mã Phòng ban</label>
                  <input
                    type="text"
                    required
                    value={editingDept.departmentCode}
                    onChange={(e) =>
                      setEditingDept({
                        ...editingDept,
                        departmentCode: e.target.value.toUpperCase(),
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Tên Phòng ban</label>
                  <input
                    type="text"
                    required
                    value={editingDept.departmentName}
                    onChange={(e) =>
                      setEditingDept({
                        ...editingDept,
                        departmentName: e.target.value,
                      })
                    }
                    placeholder="VD: Cloud & DevSecOps"
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Người Quản lý</label>
                  <input
                    type="text"
                    value={editingDept.managerName}
                    onChange={(e) =>
                      setEditingDept({
                        ...editingDept,
                        managerName: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">
                    Tầng Hoạt động Chính
                  </label>
                  <input
                    type="text"
                    value={editingDept.floorLocation}
                    onChange={(e) =>
                      setEditingDept({
                        ...editingDept,
                        floorLocation: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">
                  Mô tả chức năng nhiệm vụ
                </label>
                <textarea
                  rows={2}
                  value={editingDept.description}
                  onChange={(e) =>
                    setEditingDept({
                      ...editingDept,
                      description: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold"
                >
                  Lưu Phòng ban lên Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isGroupModalOpen && editingGroup && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 space-y-4 shadow-2xl ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold">
                Thiết lập Nhóm Chuyên môn / Dự án
              </h3>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGroupSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Mã Nhóm</label>
                  <input
                    type="text"
                    required
                    value={editingGroup.groupCode}
                    onChange={(e) =>
                      setEditingGroup({
                        ...editingGroup,
                        groupCode: e.target.value.toUpperCase(),
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">
                    Thuộc Phòng ban Chủ quản
                  </label>
                  <select
                    value={editingGroup.departmentName}
                    onChange={(e) =>
                      setEditingGroup({
                        ...editingGroup,
                        departmentName: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
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
                <label className="font-bold block mb-1">Tên Nhóm</label>
                <input
                  type="text"
                  required
                  value={editingGroup.groupName}
                  onChange={(e) =>
                    setEditingGroup({
                      ...editingGroup,
                      groupName: e.target.value,
                    })
                  }
                  placeholder="VD: Nhóm Tối ưu Hóa Mô hình 3D"
                  className={`w-full px-3 py-2 rounded-xl border font-bold ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Trưởng nhóm</label>
                  <input
                    type="text"
                    value={editingGroup.leaderName}
                    onChange={(e) =>
                      setEditingGroup({
                        ...editingGroup,
                        leaderName: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Tag Dự án</label>
                  <input
                    type="text"
                    value={editingGroup.projectTag}
                    onChange={(e) =>
                      setEditingGroup({
                        ...editingGroup,
                        projectTag: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Mô tả Nhóm</label>
                <textarea
                  rows={2}
                  value={editingGroup.description}
                  onChange={(e) =>
                    setEditingGroup({
                      ...editingGroup,
                      description: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold"
                >
                  Lưu Nhóm lên Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};