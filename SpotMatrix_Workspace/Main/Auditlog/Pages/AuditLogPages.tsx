import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  Eye,
  Lock,
  Unlock,
  Trash2,
  Users,
  FileText,
  Clock,
  X,
  Calendar,
  User,
  Mail,
  BellRing,
  AlertTriangle,
  Wifi,
  ShieldCheck,
} from 'lucide-react';
import {
  AuditConcurrencyLogItem,
  BookingPayloadItem,
  UserRoleType,
  WebLanguageCodeType,
} from '../../../Shared/Types/GlobalSystemTypes';

export interface ManagedUserAccountItem {
  accountCode: string;
  username: string;
  userEmail: string;
  fullName: string;
  departmentName: string;
  role: UserRoleType;
  trustScore: number;
  accountStatus: 'ACTIVE' | 'LOCKED' | 'SUSPENDED';
  isOnline: boolean;
  lastActiveText: string;
  recentIpAddresses?: string[];
}

export interface AuditLogPagesProps {
  auditLogs: AuditConcurrencyLogItem[];
  managedUsers: ManagedUserAccountItem[];
  bookingsList: BookingPayloadItem[];
  webLanguage?: WebLanguageCodeType;
  isDark: boolean;
  onToggleBlockUser: (username: string) => void;
  onDeleteUserAccount: (username: string) => void;
  onChangeUserRole?: (
    username: string,
    userEmail: string,
    nextRole: 'EMPLOYEE' | 'MANAGER'
  ) => void;
  onAdminOverrideBookingApproval: (
    bookingId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) => void;
  onAdminDeleteBookingWithNotification?: (
    bookingId: string,
    reasonText: string
  ) => void;
}

const AUDIT_I18N: Record<
  WebLanguageCodeType,
  {
    headerTitle: string;
    headerSub: string;
    onlineBadge: (o: number, t: number) => string;
    sec1Title: (c: number) => string;
    sec1Sub: string;
    adminRolePolicyNote: string;
    colCode: string;
    colName: string;
    colRole: string;
    colIps: string;
    colStatus: string;
    colAction: string;
    roleAdminLockedBadge: string;
    roleOptionEmployee: string;
    roleOptionManager: string;
    multiIpAlert: (c: number) => string;
    onlineText: string;
    offlineText: string;
    unlockBtn: string;
    suspendBtn: string;
    sec2Title: (c: number) => string;
    sec2Sub: string;
    posPrefix: string;
    approvedByTag: (u: string) => string;
    rejectedTag: string;
    pendingTag: string;
    requesterPrefix: string;
    slotPrefix: string;
    reasonTag: string;
    ticketStatusPrefix: string;
    viewDetailBtn: string;
    sec3Title: (c: number) => string;
    allUsersOpt: string;
    searchPlaceholder: string;
    modalTitle: (id: string) => string;
    modalSub: string;
    mRoomCode: string;
    mAccount: string;
    mEmail: string;
    mDateSlot: string;
    mPurpose: string;
    mAdminDeleteHeader: string;
    mAdminReasonLabel: (em: string) => string;
    mConfirmDeleteBtn: string;
    mCloseBtn: string;
  }
> = {
  vi: {
    headerTitle: 'Trung tâm Nhật ký Bảo mật IP, Kiểm toán Hệ thống & Quản trị User',
    headerSub:
      'Lưu vết địa chỉ IP đăng nhập (nhắc nhở khi > 2 IP khác biệt) • Đổi Role Nhân viên / Quản lý • Xem chi tiết & Xóa lịch đặt phòng',
    onlineBadge: (o, t) => `Đang đăng nhập thực tế: ${o} / ${t} tài khoản`,
    sec1Title: (c) =>
      `1. Quản lý Tài khoản, Phân quyền Role (Nhân viên / Quản lý) & Giám sát IP (${c})`,
    sec1Sub:
      'Admin có thể chuyển đổi Role của người dùng giữa Nhân viên (EMPLOYEE) và Quản lý (MANAGER) trực tiếp bên dưới.',
    adminRolePolicyNote:
      '* Quy tắc Bảo mật Tối cao: Tài khoản SYS_ADMIN phải được khởi tạo riêng từ trước trong Database Seed hoặc qua Backend, tuyệt đối không cấp quyền SYS_ADMIN qua giao diện web.',
    colCode: 'Mã Định danh',
    colName: 'Họ tên & Tài khoản',
    colRole: 'Phân quyền Role & Bộ phận',
    colIps: 'Lịch sử Địa chỉ IP Đăng nhập',
    colStatus: 'Trạng thái Phiên',
    colAction: 'Thao tác Admin',
    roleAdminLockedBadge: 'SYS_ADMIN (Khởi tạo từ DB/Backend • Cố định)',
    roleOptionEmployee: 'EMPLOYEE — Nhân viên',
    roleOptionManager: 'MANAGER — Quản lý',
    multiIpAlert: (c) => `Chú ý nhẹ: Đăng nhập từ ${c} địa chỉ IP khác biệt`,
    onlineText: 'Đang Online',
    offlineText: 'Offline',
    unlockBtn: 'Mở khóa',
    suspendBtn: 'Tạm khóa',
    sec2Title: (c) => `2. Giám sát Toàn bộ Đăng ký Đặt phòng (${c})`,
    sec2Sub:
      'Chỉ hiển thị nút “Xem chi tiết” (trong cửa sổ chi tiết Admin có thể Xóa lịch và gửi thông báo tới người đặt)',
    posPrefix: 'Vị trí:',
    approvedByTag: (u) => `ĐÃ PHÊ DUYỆT (${u})`,
    rejectedTag: 'ĐÃ TỪ CHỐI',
    pendingTag: 'ĐANG CHỜ PHÊ DUYỆT',
    requesterPrefix: 'Người đặt:',
    slotPrefix: 'Khung giờ:',
    reasonTag: 'Lý do xin phép:',
    ticketStatusPrefix: 'Trạng thái vé:',
    viewDetailBtn: 'Xem chi tiết',
    sec3Title: (c) =>
      `3. Nhật ký Truy vết Hoạt động & Địa chỉ IP Thời gian thực (${c})`,
    allUsersOpt: 'Tất cả người dùng',
    searchPlaceholder: 'Tìm mã phòng, IP, hành động...',
    modalTitle: (id) => `Chi tiết Hồ sơ Đặt phòng #${id}`,
    modalSub: 'Chế độ Kiểm toán & Điều phối Tối cao dành riêng cho SYS_ADMIN',
    mRoomCode: 'Mã Phòng / Ghế:',
    mAccount: 'Tài khoản đăng ký:',
    mEmail: 'Email người đặt:',
    mDateSlot: 'Ngày & Khung giờ:',
    mPurpose: 'Nội dung / Mục đích sử dụng phòng:',
    mAdminDeleteHeader:
      'Quyền Admin: Xóa lịch đặt phòng này & Gửi thông báo đến người đặt',
    mAdminReasonLabel: (em) =>
      `Nội dung lý do xóa (sẽ gửi thông báo cho ${em}):`,
    mConfirmDeleteBtn: 'Xác nhận Xóa lịch đặt phòng & Gửi thông báo',
    mCloseBtn: 'Đóng cửa sổ chi tiết',
  },
  en: {
    headerTitle: 'IP Security Audit Center, Concurrency Logs & User Administration',
    headerSub:
      'Tracks login IP addresses • Switch user roles between Employee and Manager • Inspect & revoke bookings',
    onlineBadge: (o, t) => `Currently Online: ${o} / ${t} accounts`,
    sec1Title: (c) =>
      `1. User Accounts, Role Assignment (Employee / Manager) & Login IP Monitor (${c})`,
    sec1Sub:
      'System Admin can switch user roles between EMPLOYEE and MANAGER directly in the table below.',
    adminRolePolicyNote:
      '* Security Policy: SYS_ADMIN accounts must be provisioned directly in Database Seed or via Backend API/CLI and cannot be granted via web UI.',
    colCode: 'Account ID',
    colName: 'Full Name & Username',
    colRole: 'Role Assignment & Department',
    colIps: 'Login IP History',
    colStatus: 'Session Status',
    colAction: 'Admin Actions',
    roleAdminLockedBadge: 'SYS_ADMIN (DB/Backend Provisioned • Locked)',
    roleOptionEmployee: 'EMPLOYEE — Staff Member',
    roleOptionManager: 'MANAGER — Department Manager',
    multiIpAlert: (c) => `Notice: Logged in from ${c} distinct IP addresses`,
    onlineText: 'Online',
    offlineText: 'Offline',
    unlockBtn: 'Unlock',
    suspendBtn: 'Suspend',
    sec2Title: (c) => `2. All Room & Hall Reservations Monitor (${c})`,
    sec2Sub:
      'Click "View Details" to inspect full booking metadata or revoke with notification',
    posPrefix: 'Node:',
    approvedByTag: (u) => `APPROVED (${u})`,
    rejectedTag: 'REJECTED',
    pendingTag: 'PENDING APPROVAL',
    requesterPrefix: 'Requester:',
    slotPrefix: 'Slot:',
    reasonTag: 'Permission Reason:',
    ticketStatusPrefix: 'Ticket Status:',
    viewDetailBtn: 'View Details',
    sec3Title: (c) =>
      `3. Real-Time Concurrency & IP Audit Trail (${c})`,
    allUsersOpt: 'All Users',
    searchPlaceholder: 'Search room code, IP, action...',
    modalTitle: (id) => `Booking Record Details #${id}`,
    modalSub: 'SYS_ADMIN Exclusive Audit & Override Console',
    mRoomCode: 'Room / Seat Code:',
    mAccount: 'Requester Account:',
    mEmail: 'Requester Email:',
    mDateSlot: 'Date & Time Window:',
    mPurpose: 'Meeting Purpose / Event Title:',
    mAdminDeleteHeader:
      'Admin Override: Delete this booking & notify the requester',
    mAdminReasonLabel: (em) =>
      `Deletion reason (will be sent to ${em}):`,
    mConfirmDeleteBtn: 'Confirm Delete Booking & Send Notification',
    mCloseBtn: 'Close Details',
  },
  ja: {
    headerTitle: 'IPセキュリティ監査・同時実行ログ・ユーザー管理センター',
    headerSub:
      'ログインIP履歴追跡 • 社員(EMPLOYEE)とマネージャー(MANAGER)のロール変更 • 予約監視と強制取消',
    onlineBadge: (o, t) => `現在オンライン: ${o} / ${t} アカウント`,
    sec1Title: (c) =>
      `1. ユーザー管理・ロール権限切替 (社員 / マネージャー)・ログインIP監視 (${c})`,
    sec1Sub:
      '管理者は一般ユーザーのロールを「社員 (EMPLOYEE)」または「マネージャー (MANAGER)」へ直接変更できます。',
    adminRolePolicyNote:
      '* セキュリティ規則：SYS_ADMIN アカウントはデータベースシードまたはバックエンド側でのみ事前作成され、Web画面から昇格させることはできません。',
    colCode: '識別コード',
    colName: '氏名＆アカウント',
    colRole: 'ロール権限＆所属部署',
    colIps: 'ログインIPアドレス履歴',
    colStatus: 'セッション状態',
    colAction: '管理者操作',
    roleAdminLockedBadge: 'SYS_ADMIN (DB/Backend 事前定義 • 固定)',
    roleOptionEmployee: 'EMPLOYEE — 一般社員',
    roleOptionManager: 'MANAGER — マネージャー',
    multiIpAlert: (c) => `注意: ${c} 個の異なるIPアドレスからのログインを検知`,
    onlineText: 'オンライン',
    offlineText: 'オフライン',
    unlockBtn: 'ロック解除',
    suspendBtn: '一時停止',
    sec2Title: (c) => `2. 全会議室・ホール予約登録の監視 (${c})`,
    sec2Sub:
      '「詳細を見る」から予約内容・申請理由の確認および通知付き予約取り消しが可能です',
    posPrefix: '場所:',
    approvedByTag: (u) => `承認済 (${u})`,
    rejectedTag: '却下済',
    pendingTag: '承認待ち',
    requesterPrefix: '予約者:',
    slotPrefix: '時間帯:',
    reasonTag: '申請理由:',
    ticketStatusPrefix: 'チケット状態:',
    viewDetailBtn: '詳細を見る',
    sec3Title: (c) =>
      `3. リアルタイム操作ログ＆IP監査トレイル (${c})`,
    allUsersOpt: 'すべてのユーザー',
    searchPlaceholder: '部屋コード、IP、操作内容で検索...',
    modalTitle: (id) => `予約レコード詳細 #${id}`,
    modalSub: 'SYS_ADMIN 専用 監査＆強制制御コンソール',
    mRoomCode: '会議室 / 座席コード:',
    mAccount: '申請アカウント:',
    mEmail: '申請者メールアドレス:',
    mDateSlot: '日付＆時間帯:',
    mPurpose: '会議目的 / イベント名:',
    mAdminDeleteHeader:
      '管理者権限：この予約を削除し、予約者に理由を通知する',
    mAdminReasonLabel: (em) =>
      `削除理由 (${em} へ通知されます):`,
    mConfirmDeleteBtn: '予約削除を確定し通知を送信',
    mCloseBtn: '閉じる',
  },
};

export const AuditLogPages: React.FC<AuditLogPagesProps> = ({
  auditLogs,
  managedUsers,
  bookingsList,
  webLanguage = 'vi',
  isDark,
  onToggleBlockUser,
  onDeleteUserAccount,
  onChangeUserRole,
  onAdminDeleteBookingWithNotification,
}) => {
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [inspectingBooking, setInspectingBooking] =
    useState<BookingPayloadItem | null>(null);
  const [adminDeleteReason, setAdminDeleteReason] = useState<string>(
    'Quản trị viên thu hồi lịch đặt phòng để điều phối sự kiện ưu tiên của hệ thống.'
  );
  const [adminActionBanner, setAdminActionBanner] = useState<string | null>(
    null
  );

  const t = AUDIT_I18N[webLanguage] || AUDIT_I18N.vi;

  const userIpMap = useMemo(() => {
    const map: Record<string, string[]> = {
      'sysadmin@spotmatrix.vn': [
        '113.161.72.104 (TP.HCM)',
        '14.231.108.55 (Hà Nội)',
        '27.74.201.18 (Đà Nẵng)',
      ],
      'manager.lead@spotmatrix.vn': ['113.161.72.104 (TP.HCM)'],
      'employee.dev@spotmatrix.vn': [
        '113.161.72.104 (TP.HCM)',
        '171.244.18.92 (Cần Thơ)',
      ],
    };
    auditLogs.forEach((log) => {
      if (log.ipAddress && log.actorEmail) {
        const key = log.actorEmail.toLowerCase();
        const existing = map[key] || [];
        if (!existing.some((ip) => ip.includes(log.ipAddress!))) {
          map[key] = [...existing, log.ipAddress];
        }
      }
    });
    return map;
  }, [auditLogs]);

  const onlineUsersCount = useMemo(() => {
    return managedUsers.filter((u) => u.isOnline).length;
  }, [managedUsers]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((item) => {
      const matchUser =
        selectedUserFilter === 'ALL' ||
        item.actorEmail
          .toLowerCase()
          .includes(selectedUserFilter.toLowerCase());
      const matchKey =
        !searchKeyword.trim() ||
        item.detailMessage
          .toLowerCase()
          .includes(searchKeyword.toLowerCase()) ||
        item.targetNodeId
          .toLowerCase()
          .includes(searchKeyword.toLowerCase()) ||
        item.actorEmail.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (item.ipAddress || '')
          .toLowerCase()
          .includes(searchKeyword.toLowerCase());
      return matchUser && matchKey;
    });
  }, [auditLogs, selectedUserFilter, searchKeyword]);

  const handleConfirmDeleteBookingFromDetail = () => {
    if (!inspectingBooking || !onAdminDeleteBookingWithNotification) return;
    const targetId = inspectingBooking.bookingId;
    const targetRoom = inspectingBooking.nodeId;
    const targetOwner = inspectingBooking.userEmail;

    onAdminDeleteBookingWithNotification(
      targetId,
      adminDeleteReason.trim() || 'Thu hồi lịch theo điều phối của System Admin'
    );
    setInspectingBooking(null);
    setAdminActionBanner(
      `Đã xóa lịch đặt phòng ${targetRoom} (${targetId}) và tự động gửi thông báo lý do xóa đến người đặt (${targetOwner})!`
    );
  };

  return (
    <div className="space-y-6">
      <div
        className={`p-5 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${
          isDark
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className={`text-lg font-extrabold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {t.headerTitle}
              </h1>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-600 text-white uppercase">
                SYS_ADMIN EXCLUSIVE
              </span>
            </div>
            <p
              className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {t.headerSub}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3.5 py-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
            {t.onlineBadge(onlineUsersCount, managedUsers.length)}
          </span>
        </div>
      </div>

      {adminActionBanner && (
        <div className="p-4 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <BellRing className="w-4 h-4 shrink-0" />
            {adminActionBanner}
          </span>
          <button
            type="button"
            onClick={() => setAdminActionBanner(null)}
            className="underline text-[11px] shrink-0"
          >
            OK
          </button>
        </div>
      )}

      {/* BẢNG 1: QUẢN LÝ TÀI KHOẢN, ĐỔI ROLE (EMPLOYEE <-> MANAGER) & GIÁM SÁT IP */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDark
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-3">
          <div className="space-y-1">
            <h2
              className={`text-sm font-bold flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600" />
              {t.sec1Title(managedUsers.length)}
            </h2>
            <p className="text-xs text-slate-400">{t.sec1Sub}</p>
            <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1.5 pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{t.adminRolePolicyNote}</span>
            </p>
          </div>
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
                <th className="py-3 px-3 font-bold">{t.colCode}</th>
                <th className="py-3 px-3 font-bold">{t.colName}</th>
                <th className="py-3 px-3 font-bold">{t.colRole}</th>
                <th className="py-3 px-3 font-bold">{t.colIps}</th>
                <th className="py-3 px-3 font-bold">{t.colStatus}</th>
                <th className="py-3 px-3 font-bold text-right">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
              {managedUsers.map((user) => {
                const ips =
                  user.recentIpAddresses ||
                  userIpMap[user.userEmail.toLowerCase()] || [
                    '113.161.72.104 (TP.HCM)',
                  ];
                const hasManyIps = ips.length > 2;

                return (
                  <tr
                    key={user.username}
                    className={
                      isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/90'
                    }
                  >
                    <td className="py-3.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {user.accountCode}
                    </td>
                    <td className="py-3.5 px-3">
                      <div
                        className={`font-bold ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {user.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        @{user.username} • {user.userEmail}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      {user.role === 'SYS_ADMIN' ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-500/15 text-rose-500 border border-rose-500/30 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {t.roleAdminLockedBadge}
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => {
                            const nextRole = e.target.value as
                              | 'EMPLOYEE'
                              | 'MANAGER';
                            if (onChangeUserRole) {
                              onChangeUserRole(
                                user.username,
                                user.userEmail,
                                nextRole
                              );
                              setAdminActionBanner(
                                `Đã chuyển đổi vai trò của tài khoản @${user.username} (${user.userEmail}) sang [${nextRole}] thành công!`
                              );
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-xl border text-xs font-extrabold outline-none transition ${
                            user.role === 'MANAGER'
                              ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300'
                              : 'bg-teal-500/15 border-teal-500/40 text-teal-700 dark:text-teal-300'
                          }`}
                        >
                          <option value="EMPLOYEE">
                            {t.roleOptionEmployee}
                          </option>
                          <option value="MANAGER">{t.roleOptionManager}</option>
                        </select>
                      )}
                      <div className="text-[11px] text-slate-400 mt-1">
                        {user.departmentName}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {ips.map((ipStr) => (
                          <span
                            key={ipStr}
                            className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 inline-flex items-center gap-1"
                          >
                            <Wifi className="w-2.5 h-2.5 text-indigo-500" />
                            {ipStr}
                          </span>
                        ))}
                      </div>
                      {hasManyIps && (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[10px] font-extrabold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{t.multiIpAlert(ips.length)}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            user.isOnline ? 'bg-teal-500' : 'bg-slate-400'
                          }`}
                        />
                        <span
                          className={`font-bold ${
                            user.isOnline
                              ? 'text-teal-600 dark:text-teal-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {user.isOnline ? t.onlineText : t.offlineText}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {user.lastActiveText}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onToggleBlockUser(user.username)}
                          disabled={user.role === 'SYS_ADMIN'}
                          className={`px-2.5 py-1.5 rounded-lg font-bold inline-flex items-center gap-1 transition ${
                            user.role === 'SYS_ADMIN'
                              ? 'opacity-40 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400'
                              : user.accountStatus === 'SUSPENDED'
                              ? 'bg-teal-600 text-white hover:bg-teal-500'
                              : 'bg-amber-500/15 text-amber-600 hover:bg-amber-500 hover:text-white'
                          }`}
                        >
                          {user.accountStatus === 'SUSPENDED' ? (
                            <>
                              <Unlock className="w-3 h-3" /> {t.unlockBtn}
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" /> {t.suspendBtn}
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteUserAccount(user.username)}
                          disabled={user.role === 'SYS_ADMIN'}
                          className={`p-1.5 rounded-lg transition ${
                            user.role === 'SYS_ADMIN'
                              ? 'opacity-40 cursor-not-allowed text-slate-400'
                              : 'text-rose-500 hover:bg-rose-500/15'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BẢNG 2: DANH SÁCH ĐĂNG KÝ ĐẶT PHÒNG */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDark
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-3">
          <div>
            <h2
              className={`text-sm font-bold flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              {t.sec2Title(bookingsList.length)}
            </h2>
            <p className="text-xs text-slate-400">{t.sec2Sub}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {bookingsList.map((bk) => (
            <div
              key={bk.bookingId}
              className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                isDark
                  ? 'bg-slate-950 border-slate-800'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-600 text-white">
                      {t.posPrefix} {bk.nodeId}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      #{bk.bookingId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        bk.approvalStatus === 'APPROVED'
                          ? 'bg-teal-500/15 text-teal-600'
                          : bk.approvalStatus === 'REJECTED'
                          ? 'bg-rose-500/15 text-rose-600'
                          : 'bg-amber-500/15 text-amber-600'
                      }`}
                    >
                      {bk.approvalStatus === 'APPROVED'
                        ? t.approvedByTag(bk.approvedByUsername || 'System')
                        : bk.approvalStatus === 'REJECTED'
                        ? t.rejectedTag
                        : t.pendingTag}
                    </span>
                  </div>
                  <p
                    className={`text-xs font-bold mt-1.5 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {bk.purposeNote}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t.requesterPrefix} <strong>{bk.userEmail}</strong> •{' '}
                    {t.slotPrefix} {bk.startTimeIso} – {bk.endTimeIso} (
                    {bk.bookingDateIso})
                  </p>
                  {bk.approvalRequestReason && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-300 mt-1 font-semibold">
                      {t.reasonTag} “{bk.approvalRequestReason}”
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  {t.ticketStatusPrefix} <strong>{bk.bookingStatus}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setInspectingBooking(bk)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Eye className="w-3.5 h-3.5" /> {t.viewDetailBtn}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BẢNG 3: NHẬT KÝ TRUY VẾT HÀNH ĐỘNG */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDark
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-3">
          <div>
            <h2
              className={`text-sm font-bold flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-500" />
              {t.sec3Title(filteredAuditLogs.length)}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="ALL">{t.allUsersOpt}</option>
              {managedUsers.map((u) => (
                <option key={u.username} value={u.userEmail}>
                  {u.fullName} (@{u.username})
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder={t.searchPlaceholder}
                className={`pl-8 pr-3 py-2 rounded-xl border text-xs font-medium outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {filteredAuditLogs.map((log) => (
            <div
              key={log.auditId}
              className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                isDark
                  ? 'bg-slate-950 border-slate-800'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      log.outcomeStatus === 'SUCCESS'
                        ? 'bg-teal-500/15 text-teal-600'
                        : log.outcomeStatus === 'CONFLICT_BLOCKED'
                        ? 'bg-rose-500/15 text-rose-600'
                        : 'bg-amber-500/15 text-amber-600'
                    }`}
                  >
                    {log.eventCategory}
                  </span>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                    Actor: {log.actorEmail}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    • Target: {log.targetNodeId}
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-indigo-500/10 text-indigo-500">
                    IP: {log.ipAddress || '113.161.72.104'}
                  </span>
                </div>
                <p
                  className={`text-xs font-medium ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}
                >
                  {log.detailMessage}
                </p>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(log.createdAtIso).toLocaleTimeString('vi-VN')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT */}
      {inspectingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-extrabold">
                    {t.modalTitle(inspectingBooking.bookingId)}
                  </h3>
                  <p className="text-[11px] text-indigo-100">{t.modalSub}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingBooking(null)}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t.mRoomCode}</span>
                  <span className="px-2.5 py-1 rounded-lg font-extrabold bg-indigo-600 text-white">
                    {inspectingBooking.nodeId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> {t.mAccount}
                  </span>
                  <strong>
                    @{inspectingBooking.requesterUsername || 'User'} (
                    {inspectingBooking.requesterRole || 'EMPLOYEE'})
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> {t.mEmail}
                  </span>
                  <strong>{inspectingBooking.userEmail}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> {t.mDateSlot}
                  </span>
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    {inspectingBooking.bookingDateIso || 'Today'} •{' '}
                    {inspectingBooking.startTimeIso} –{' '}
                    {inspectingBooking.endTimeIso}
                  </strong>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-400 block mb-1">
                  {t.mPurpose}
                </span>
                <div
                  className={`p-3.5 rounded-xl border font-semibold ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {inspectingBooking.purposeNote}
                </div>
              </div>

              {inspectingBooking.approvalRequestReason && (
                <div>
                  <span className="font-bold text-amber-500 block mb-1">
                    {t.reasonTag}
                  </span>
                  <div
                    className={`p-3.5 rounded-xl border font-semibold ${
                      isDark
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {inspectingBooking.approvalRequestReason}
                  </div>
                </div>
              )}

              {onAdminDeleteBookingWithNotification && (
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDark
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-rose-50/70 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{t.mAdminDeleteHeader}</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      {t.mAdminReasonLabel(inspectingBooking.userEmail)}
                    </label>
                    <input
                      type="text"
                      value={adminDeleteReason}
                      onChange={(e) => setAdminDeleteReason(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 text-white'
                          : 'bg-white border-rose-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteBookingFromDetail}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t.mConfirmDeleteBtn}
                  </button>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectingBooking(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-extrabold transition"
                >
                  {t.mCloseBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};