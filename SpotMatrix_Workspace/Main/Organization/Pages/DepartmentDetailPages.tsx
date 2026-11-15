import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Building2,
  Users,
  Layers,
  Award,
  CalendarCheck,
  UserPlus,
  Edit3,
  Trash2,
  Search,
  X,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  BookingPayloadItem,
  OrganizationDepartmentItem,
  OrganizationGroupItem,
  UserRoleType,
  UserTrustProfileItem,
  WebLanguageCodeType,
} from '../../../Shared/Types/GlobalSystemTypes';
import {
  DepartmentGroupsPanel,
  formatPersonDisplayNameForLocale,
} from '../Groups/DepartmentGroupsPanel';

export interface DepartmentDetailPagesProps {
  department: OrganizationDepartmentItem;
  groupsList: OrganizationGroupItem[];
  allCompanyMembers: UserTrustProfileItem[];
  bookingsList: BookingPayloadItem[];
  userEmail: string;
  userRole: UserRoleType;
  webLanguage?: WebLanguageCodeType;
  isDark: boolean;
  onBackToList: () => void;
  onOpenEditDepartment: (dept: OrganizationDepartmentItem) => void;
  onDeleteDepartment: (departmentId: string) => void;
  onOpenAssignMemberModal: (dept: OrganizationDepartmentItem) => void;
  onRemoveMemberFromDepartment: (userEmail: string) => void;
  onOpenCreateGroupForDept: (departmentName: string) => void;
  onOpenEditGroup: (group: OrganizationGroupItem) => void;
  onDeleteGroup: (groupId: string) => void;
  onToggleGroupMember: (groupId: string, targetUserEmail: string) => void;
  onNavigateToHallBooking?: () => void;
}

type DetailSectionTab = 'MEMBERS' | 'GROUPS' | 'BOOKINGS_AND_ZONES';

export function formatFloorLocationForLocale(
  rawFloor: string,
  lang: WebLanguageCodeType
): string {
  if (lang === 'vi') return rawFloor;
  if (lang === 'en') {
    return rawFloor
      .replace(/Tầng/g, 'Floor')
      .replace('Hội trường Đấu Trường La Mã', 'Colosseum Amphitheater')
      .replace('Hội trường', 'Amphitheater')
      .replace('Khu Phòng họp Chuẩn', 'Standard Meeting Zone')
      .replace('Khu Kỹ thuật & Sprint', 'Engineering & Sprint Zone')
      .replace('Khu Thiết kế & Sáng tạo', 'Design & Creative Zone')
      .replace('Khu AI & Khoa học Dữ liệu', 'AI & Data Science Zone')
      .replace('Toàn bộ 5 Tầng Tòa nhà', 'All 5 Building Floors');
  }
  return rawFloor
    .replace(/Tầng (\d+)/g, '$1階')
    .replace('Hội trường Đấu Trường La Mã', 'コロッセオ大ホール')
    .replace('Hội trường', '大ホール')
    .replace('Khu Phòng họp Chuẩn', '標準会議室エリア')
    .replace('Khu Kỹ thuật & Sprint', '技術＆スプリントエリア')
    .replace('Khu Thiết kế & Sáng tạo', 'デザイン＆クリエイティブエリア')
    .replace('Khu AI & Khoa học Dữ liệu', 'AI＆データサイエンスエリア')
    .replace('Toàn bộ 5 Tầng Tòa nhà', '全5フロア全体');
}

const DEPT_DETAIL_I18N: Record<
  WebLanguageCodeType,
  {
    backBtn: string;
    detailPageBadge: string;
    rbacManageBadge: (role: string) => string;
    rbacReadOnlyBadge: string;
    managerLabel: string;
    floorZoneLabel: string;
    editDeptBtn: string;
    deleteDeptBtn: string;
    addMemberBtn: string;
    kpi1Members: string;
    kpi2Groups: string;
    kpi3AvgTrust: string;
    kpi4Bookings: string;
    tab1Members: (c: number) => string;
    tab2Groups: (c: number) => string;
    tab3Bookings: (c: number) => string;
    searchEmpPlaceholder: string;
    roleFilterAll: string;
    joinedGroupsLabel: (c: number) => string;
    noGroupYet: string;
    trustScoreLabel: string;
    removeMemberTitle: string;
    emptyMembersText: string;
    bookingsSectionTitle: string;
    bookingsSectionSub: string;
    hallEventsTitle: string;
    noBookingsText: string;
    bookHallBtn: string;
  }
> = {
  vi: {
    backBtn: '← Quay lại Danh sách Phòng ban',
    detailPageBadge: 'TRANG CHI TIẾT PHÒNG BAN ĐỘC LẬP',
    rbacManageBadge: (role) =>
      `Quyền ${role}: Được phép Quản lý Thành viên & Nhóm chuyên môn`,
    rbacReadOnlyBadge:
      'Quyền EMPLOYEE (Nhân viên): Chế độ Chỉ Xem (Không có quyền tạo/sửa phòng ban hay nhóm)',
    managerLabel: 'Quản lý Phụ trách:',
    floorZoneLabel: 'Khu vực Tầng Hoạt động:',
    editDeptBtn: 'Chỉnh sửa Phòng ban',
    deleteDeptBtn: 'Xóa Phòng ban',
    addMemberBtn: '+ Thêm Nhân sự từ Công ty',
    kpi1Members: 'Tổng Nhân sự Trực thuộc',
    kpi2Groups: 'Nhóm Chuyên biệt (Squads)',
    kpi3AvgTrust: 'Điểm Tín nhiệm Trung bình',
    kpi4Bookings: 'Lịch Họp & Sự kiện Phòng ban',
    tab1Members: (c) => `1. Nhân sự Trực thuộc (${c})`,
    tab2Groups: (c) => `2. Các Nhóm Chuyên biệt (${c})`,
    tab3Bookings: (c) => `3. Không gian Tầng & Lịch họp (${c})`,
    searchEmpPlaceholder: 'Tìm nhân viên theo họ tên, email...',
    roleFilterAll: 'Tất cả vai trò',
    joinedGroupsLabel: (c) => `Nhóm tham gia (${c}):`,
    noGroupYet: 'Chưa tham gia nhóm',
    trustScoreLabel: 'Điểm tín nhiệm:',
    removeMemberTitle: 'Gỡ nhân sự khỏi phòng ban',
    emptyMembersText: 'Không tìm thấy nhân sự nào khớp bộ lọc trong phòng ban này.',
    bookingsSectionTitle: 'Danh sách Lịch Đặt phòng của Thành viên Phòng ban',
    bookingsSectionSub:
      'Tổng hợp các lịch họp tại Tầng 1–4 và vé tham dự Hội trường Tầng 5 của phòng ban này.',
    hallEventsTitle: 'Sự kiện Hội trường Tầng 5 (H-01) Cho phép Phòng ban Tham gia',
    noBookingsText: 'Hiện chưa có lịch đặt phòng nào của phòng ban này.',
    bookHallBtn: 'Đặt lịch Phòng / Hội trường →',
  },
  en: {
    backBtn: '← Back to Department Directory',
    detailPageBadge: 'DEDICATED DEPARTMENT DETAIL PAGE',
    rbacManageBadge: (role) =>
      `${role} Access: Authorized to Manage Members & Sub-Groups`,
    rbacReadOnlyBadge:
      'EMPLOYEE Access: Read-Only Mode (Cannot create/modify departments or groups)',
    managerLabel: 'Department Manager:',
    floorZoneLabel: 'Assigned Floor Zone:',
    editDeptBtn: 'Edit Department',
    deleteDeptBtn: 'Delete',
    addMemberBtn: '+ Add Member from Directory',
    kpi1Members: 'Assigned Employees',
    kpi2Groups: 'Specialized Sub-Groups',
    kpi3AvgTrust: 'Average Trust Score',
    kpi4Bookings: 'Department Active Bookings',
    tab1Members: (c) => `1. Department Members (${c})`,
    tab2Groups: (c) => `2. Specialized Sub-Groups (${c})`,
    tab3Bookings: (c) => `3. Floor Zone & Schedule (${c})`,
    searchEmpPlaceholder: 'Search employee by name, email...',
    roleFilterAll: 'All Roles',
    joinedGroupsLabel: (c) => `Joined Groups (${c}):`,
    noGroupYet: 'No group yet',
    trustScoreLabel: 'Trust Score:',
    removeMemberTitle: 'Remove employee from department',
    emptyMembersText: 'No employees match the current filter in this department.',
    bookingsSectionTitle: 'Room & Hall Bookings by Department Members',
    bookingsSectionSub:
      'All active meeting sessions on Floors 1–4 and Floor 5 Amphitheater passes for this department.',
    hallEventsTitle: 'Floor 5 Colosseum Hall (H-01) Events Open to This Department',
    noBookingsText: 'No active bookings recorded for this department yet.',
    bookHallBtn: 'Go to Room & Hall Booking →',
  },
  ja: {
    backBtn: '← 部署一覧へ戻る',
    detailPageBadge: '部署詳細専用ページ',
    rbacManageBadge: (role) =>
      `${role} 権限：メンバーおよび専門グループの管理が可能`,
    rbacReadOnlyBadge:
      'EMPLOYEE (一般社員) 権限：閲覧専用モード（部署やグループの作成・編集はできません）',
    managerLabel: '担当マネージャー:',
    floorZoneLabel: '主要活動フロア:',
    editDeptBtn: '部署情報を編集',
    deleteDeptBtn: '削除',
    addMemberBtn: '+ 社員名簿からメンバー追加',
    kpi1Members: '所属社員総数',
    kpi2Groups: '専門サブグループ数',
    kpi3AvgTrust: '部署平均信頼スコア',
    kpi4Bookings: '部署の会議・イベント予約',
    tab1Members: (c) => `1. 所属社員一覧 (${c}名)`,
    tab2Groups: (c) => `2. 専門サブグループ (${c})`,
    tab3Bookings: (c) => `3. 担当フロア＆予約スケジュール (${c})`,
    searchEmpPlaceholder: '氏名、メールアドレスで社員を検索...',
    roleFilterAll: 'すべてのロール',
    joinedGroupsLabel: (c) => `参加グループ (${c}):`,
    noGroupYet: '未参加',
    trustScoreLabel: '信頼スコア:',
    removeMemberTitle: '部署からメンバーを外す',
    emptyMembersText: '条件に一致する所属社員が見つかりません。',
    bookingsSectionTitle: 'この部署の社員による会議室予約一覧',
    bookingsSectionSub:
      '1〜4階の会議室予約および5階コロッセオ大ホールの参加チケット一覧です。',
    hallEventsTitle: 'この部署が参加可能な5階大ホール (H-01) イベント',
    noBookingsText: '現在、この部署に関連する有効な予約はありません。',
    bookHallBtn: '会議室・ホール予約へ移動 →',
  },
};

export const DepartmentDetailPages: React.FC<DepartmentDetailPagesProps> = ({
  department,
  groupsList,
  allCompanyMembers,
  bookingsList,
  userEmail,
  userRole,
  webLanguage = 'vi',
  isDark,
  onBackToList,
  onOpenEditDepartment,
  onDeleteDepartment,
  onOpenAssignMemberModal,
  onRemoveMemberFromDepartment,
  onOpenCreateGroupForDept,
  onOpenEditGroup,
  onDeleteGroup,
  onToggleGroupMember,
  onNavigateToHallBooking,
}) => {
  const isSysAdmin = userRole === 'SYS_ADMIN';
  // Phân quyền chuẩn: Chỉ MANAGER và SYS_ADMIN mới được thao tác quản trị phòng ban/nhóm; EMPLOYEE chỉ xem
  const canManageDept = userRole === 'SYS_ADMIN' || userRole === 'MANAGER';
  const t = DEPT_DETAIL_I18N[webLanguage] || DEPT_DETAIL_I18N.vi;

  const [activeSubTab, setActiveSubTab] = useState<DetailSectionTab>('MEMBERS');
  const [empSearchQuery, setEmpSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'MANAGER' | 'EMPLOYEE'>(
    'ALL'
  );

  const deptMembers = useMemo(() => {
    return allCompanyMembers.filter((m) => {
      if (!isSysAdmin && m.role === 'SYS_ADMIN') return false;
      return (
        department.memberEmails.some(
          (em) => em.trim().toLowerCase() === m.userEmail.trim().toLowerCase()
        ) ||
        m.departmentName.trim().toLowerCase() ===
          department.departmentName.trim().toLowerCase()
      );
    });
  }, [allCompanyMembers, department, isSysAdmin]);

  const filteredMembers = useMemo(() => {
    const q = empSearchQuery.trim().toLowerCase();
    return deptMembers.filter((m) => {
      if (roleFilter !== 'ALL' && m.role !== roleFilter) return false;
      if (!q) return true;
      return (
        m.fullName.toLowerCase().includes(q) ||
        m.userEmail.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
      );
    });
  }, [deptMembers, roleFilter, empSearchQuery]);

  const deptGroups = useMemo(() => {
    return groupsList.filter(
      (g) =>
        g.departmentName.trim().toLowerCase() ===
        department.departmentName.trim().toLowerCase()
    );
  }, [groupsList, department.departmentName]);

  const deptBookings = useMemo(() => {
    return bookingsList.filter((b) => {
      if (b.bookingStatus === 'CANCELLED' || b.approvalStatus === 'REJECTED') {
        return false;
      }
      const byDeptName =
        (b.departmentName || '').trim().toLowerCase() ===
        department.departmentName.trim().toLowerCase();
      const byMemberEmail = deptMembers.some(
        (m) => m.userEmail.trim().toLowerCase() === b.userEmail.trim().toLowerCase()
      );
      const byAllowedHall =
        b.bookingMode === 'HALL_EVENT_RENTAL' &&
        b.allowedDepartments?.some(
          (d) =>
            d.trim().toLowerCase() ===
            department.departmentName.trim().toLowerCase()
        );
      return byDeptName || byMemberEmail || byAllowedHall;
    });
  }, [bookingsList, department.departmentName, deptMembers]);

  const avgTrustScore = useMemo(() => {
    if (deptMembers.length === 0) return 100;
    const sum = deptMembers.reduce((acc, item) => acc + item.trustScore, 0);
    return Math.round(sum / deptMembers.length);
  }, [deptMembers]);

  return (
    <div className="space-y-6">
      {/* Thanh Điều hướng Quay lại & Nhãn Phân quyền RBAC */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToList}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backBtn}</span>
        </button>

        <span
          className={`px-3.5 py-1.5 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 border ${
            canManageDept
              ? 'bg-teal-500/15 border-teal-500/30 text-teal-600 dark:text-teal-300'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-300'
          }`}
        >
          {!canManageDept && <Lock className="w-3.5 h-3.5" />}
          <span>
            {canManageDept ? t.rbacManageBadge(userRole) : t.rbacReadOnlyBadge}
          </span>
        </span>
      </div>

      {/* Khu vực 1: Header Hồ sơ Phòng ban & Các Nút Quản trị */}
      <div
        className={`p-6 rounded-3xl border space-y-5 ${
          isDark
            ? 'bg-slate-900/95 border-indigo-500/40 shadow-xl'
            : 'bg-white border-indigo-100 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/70 dark:border-slate-800 pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-indigo-600 text-white">
                {t.detailPageBadge}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-black bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                {department.departmentCode}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-indigo-600 shrink-0" />
              <span>{department.departmentName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              {department.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
              <span>
                <span className="text-slate-400">{t.managerLabel} </span>
                <strong className="font-extrabold">
                  {formatPersonDisplayNameForLocale(
                    department.managerName,
                    webLanguage
                  )}
                </strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>
                <span className="text-slate-400">{t.floorZoneLabel} </span>
                <strong className="font-extrabold text-indigo-500">
                  {formatFloorLocationForLocale(
                    department.floorLocation,
                    webLanguage
                  )}
                </strong>
              </span>
            </div>
          </div>

          {canManageDept && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAssignMemberModal(department)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t.addMemberBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenEditDepartment(department)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t.editDeptBtn}</span>
              </button>

              {isSysAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteDepartment(department.departmentId);
                    onBackToList();
                  }}
                  className="px-3 py-2 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-extrabold flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.deleteDeptBtn}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 4 Thẻ Chỉ số KPI của Phòng ban */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark
                ? 'bg-slate-950/80 border-slate-800'
                : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div>
              <p className="text-[11px] font-bold text-slate-400">
                {t.kpi1Members}
              </p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                {deptMembers.length}
              </p>
            </div>
            <Users className="w-8 h-8 text-indigo-500/30" />
          </div>

          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark
                ? 'bg-slate-950/80 border-slate-800'
                : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div>
              <p className="text-[11px] font-bold text-slate-400">
                {t.kpi2Groups}
              </p>
              <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-0.5">
                {deptGroups.length}
              </p>
            </div>
            <Layers className="w-8 h-8 text-teal-500/30" />
          </div>

          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark
                ? 'bg-slate-950/80 border-slate-800'
                : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div>
              <p className="text-[11px] font-bold text-slate-400">
                {t.kpi3AvgTrust}
              </p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {avgTrustScore} pts
              </p>
            </div>
            <Award className="w-8 h-8 text-emerald-500/30" />
          </div>

          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark
                ? 'bg-slate-950/80 border-slate-800'
                : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div>
              <p className="text-[11px] font-bold text-slate-400">
                {t.kpi4Bookings}
              </p>
              <p className="text-2xl font-black text-amber-500 mt-0.5">
                {deptBookings.length}
              </p>
            </div>
            <CalendarCheck className="w-8 h-8 text-amber-500/30" />
          </div>
        </div>
      </div>

      {/* Khu vực 2: Thanh Chuyển đổi 3 Phân khu Chức năng trên Trang Chi tiết Phòng ban */}
      <div
        className={`p-6 rounded-3xl border space-y-6 ${
          isDark
            ? 'bg-slate-900/95 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('MEMBERS')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                activeSubTab === 'MEMBERS'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t.tab1Members(deptMembers.length)}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('GROUPS')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                activeSubTab === 'GROUPS'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t.tab2Groups(deptGroups.length)}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('BOOKINGS_AND_ZONES')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                activeSubTab === 'BOOKINGS_AND_ZONES'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{t.tab3Bookings(deptBookings.length)}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DANH SÁCH NHÂN SỰ TRỰC THUỘC */}
        {activeSubTab === 'MEMBERS' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {(['ALL', 'MANAGER', 'EMPLOYEE'] as const).map((rf) => (
                  <button
                    key={rf}
                    type="button"
                    onClick={() => setRoleFilter(rf)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                      roleFilter === rf
                        ? 'bg-indigo-600 text-white'
                        : isDark
                        ? 'bg-slate-800 text-slate-400 hover:text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {rf === 'ALL' ? t.roleFilterAll : rf}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={empSearchQuery}
                  onChange={(e) => setEmpSearchQuery(e.target.value)}
                  placeholder={t.searchEmpPlaceholder}
                  className={`w-full pl-8 pr-7 py-2 rounded-xl border text-xs font-semibold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
                {empSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setEmpSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed text-center text-xs text-slate-400 border-slate-300 dark:border-slate-800">
                {t.emptyMembersText}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map((emp) => {
                  const empGroups = deptGroups.filter((g) =>
                    g.memberEmails.some(
                      (em) =>
                        em.trim().toLowerCase() ===
                        emp.userEmail.trim().toLowerCase()
                    )
                  );

                  return (
                    <div
                      key={emp.userEmail}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                        isDark
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-extrabold truncate">
                              {formatPersonDisplayNameForLocale(
                                emp.fullName,
                                webLanguage
                              )}
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
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                            {t.trustScoreLabel} {emp.trustScore} pts
                          </p>
                        </div>

                        {canManageDept && emp.role !== 'SYS_ADMIN' && (
                          <button
                            type="button"
                            onClick={() =>
                              onRemoveMemberFromDepartment(emp.userEmail)
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                            title={t.removeMemberTitle}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center gap-1">
                        <span className="text-[10px] text-slate-400">
                          {t.joinedGroupsLabel(empGroups.length)}
                        </span>
                        {empGroups.length === 0 ? (
                          <span className="text-[10px] italic text-slate-400">
                            {t.noGroupYet}
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
            )}
          </div>
        )}

        {/* TAB 2: CÁC NHÓM CHUYÊN BIỆT TRỰC THUỘC PHÒNG BAN */}
        {activeSubTab === 'GROUPS' && (
          <DepartmentGroupsPanel
            parentDepartment={department}
            groupsList={groupsList}
            allMembers={allCompanyMembers}
            userEmail={userEmail}
            userRole={userRole}
            webLanguage={webLanguage}
            isDark={isDark}
            onOpenCreateGroupForDept={onOpenCreateGroupForDept}
            onOpenEditGroup={onOpenEditGroup}
            onDeleteGroup={onDeleteGroup}
            onToggleGroupMember={onToggleGroupMember}
          />
        )}

        {/* TAB 3: KHÔNG GIAN TẦNG PHỤ TRÁCH & LỊCH HỌP CỦA PHÒNG BAN */}
        {activeSubTab === 'BOOKINGS_AND_ZONES' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs sm:text-sm font-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{t.bookingsSectionTitle}</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.bookingsSectionSub}
                </p>
              </div>

              {onNavigateToHallBooking && (
                <button
                  type="button"
                  onClick={onNavigateToHallBooking}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition shadow-sm"
                >
                  {t.bookHallBtn}
                </button>
              )}
            </div>

            {deptBookings.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed text-center text-xs text-slate-400 border-slate-300 dark:border-slate-800">
                {t.noBookingsText}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {deptBookings.map((bk) => (
                  <div
                    key={bk.bookingId}
                    className={`p-4 rounded-2xl border space-y-2 ${
                      isDark
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-indigo-600 text-white">
                          {bk.nodeId}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          #{bk.bookingId}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          bk.bookingStatus === 'CHECKED_IN'
                            ? 'bg-teal-500/15 text-teal-600 dark:text-teal-300'
                            : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                        }`}
                      >
                        {bk.bookingStatus}
                      </span>
                    </div>

                    <p className="text-xs font-extrabold">{bk.purposeNote}</p>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        <span>
                          {bk.bookingDateIso} ({bk.startTimeIso} – {bk.endTimeIso})
                        </span>
                      </span>
                      <strong>{bk.userEmail}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
