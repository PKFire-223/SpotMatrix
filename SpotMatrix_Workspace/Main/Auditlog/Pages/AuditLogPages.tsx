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
} from 'lucide-react';
import {
  AuditConcurrencyLogItem,
  BookingPayloadItem,
  UserRoleType,
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
  isDark: boolean;
  onToggleBlockUser: (username: string) => void;
  onDeleteUserAccount: (username: string) => void;
  onAdminOverrideBookingApproval: (
    bookingId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) => void;
  onAdminDeleteBookingWithNotification?: (
    bookingId: string,
    reasonText: string
  ) => void;
}

export const AuditLogPages: React.FC<AuditLogPagesProps> = ({
  auditLogs,
  managedUsers,
  bookingsList,
  isDark,
  onToggleBlockUser,
  onDeleteUserAccount,
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

  // Tổng hợp danh sách IP đăng nhập cho từng tài khoản để phát hiện > 2 IP khác biệt
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
                Trung tâm Nhật ký Bảo mật IP, Kiểm toán Hệ thống & Quản trị User
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
              Lưu vết địa chỉ IP đăng nhập (nhắc nhở khi &gt; 2 IP khác biệt) • Xem chi tiết & Xóa lịch đặt phòng kèm gửi thông báo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3.5 py-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
            Đang đăng nhập thực tế: {onlineUsersCount} / {managedUsers.length}{' '}
            tài khoản
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
            Đóng
          </button>
        </div>
      )}

      {/* BẢNG 1: QUẢN LÝ TÀI KHOẢN & GIÁM SÁT ĐỊA CHỈ IP ĐĂNG NHẬP */}
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
              <Users className="w-4 h-4 text-indigo-600" />
              1. Quản lý Tài khoản, Trạng thái Online & Giám sát Địa chỉ IP Đăng nhập ({managedUsers.length})
            </h2>
            <p className="text-xs text-slate-400">
              Tự động gắn nhãn nhắc nhở chú ý nhẹ khi phát hiện tài khoản đăng nhập từ nhiều hơn 2 địa chỉ IP khác biệt
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
                <th className="py-3 px-3 font-bold">Mã Định danh</th>
                <th className="py-3 px-3 font-bold">Họ tên & Tài khoản</th>
                <th className="py-3 px-3 font-bold">Vai trò & Bộ phận</th>
                <th className="py-3 px-3 font-bold">
                  Lịch sử Địa chỉ IP Đăng nhập
                </th>
                <th className="py-3 px-3 font-bold">Trạng thái Phiên</th>
                <th className="py-3 px-3 font-bold text-right">
                  Thao tác Admin
                </th>
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                        {user.role}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-0.5">
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
                          <span>
                            Chú ý nhẹ: Đăng nhập từ {ips.length} địa chỉ IP khác
                            biệt
                          </span>
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
                          {user.isOnline ? 'Đang Online' : 'Offline'}
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
                              <Unlock className="w-3 h-3" /> Mở khóa
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" /> Tạm khóa
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
              2. Giám sát Toàn bộ Đăng ký Đặt phòng ({bookingsList.length})
            </h2>
            <p className="text-xs text-slate-400">
              Chỉ hiển thị nút “Xem chi tiết” (trong cửa sổ chi tiết Admin có thể Xóa lịch và gửi thông báo tới người đặt)
            </p>
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
                      Vị trí: {bk.nodeId}
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
                        ? `ĐÃ PHÊ DUYỆT (${bk.approvedByUsername || 'System'})`
                        : bk.approvalStatus === 'REJECTED'
                        ? 'ĐÃ TỪ CHỐI'
                        : 'ĐANG CHỜ PHÊ DUYỆT'}
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
                    Người đặt: <strong>{bk.userEmail}</strong> • Khung giờ:{' '}
                    {bk.startTimeIso} – {bk.endTimeIso} ({bk.bookingDateIso})
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  Trạng thái vé: <strong>{bk.bookingStatus}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setInspectingBooking(bk)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BẢNG 3: NHẬT KÝ TRUY VẾT HÀNH ĐỘNG CỦA TỪNG USER KÈM ĐỊA CHỈ IP */}
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
              3. Nhật ký Truy vết Hoạt động & Địa chỉ IP Thời gian thực ({filteredAuditLogs.length})
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
              <option value="ALL">Tất cả người dùng</option>
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
                placeholder="Tìm mã phòng, IP, hành động..."
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

      {/* MODAL XEM CHI TIẾT ĐĂNG KÝ ĐẶT PHÒNG & NÚT XÓA LỊCH KÈM GỬI THÔNG BÁO */}
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
                    Chi tiết Hồ sơ Đặt phòng #{inspectingBooking.bookingId}
                  </h3>
                  <p className="text-[11px] text-indigo-100">
                    Chế độ Kiểm toán & Điều phối Tối cao dành riêng cho SYS_ADMIN
                  </p>
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
                  <span className="text-slate-400">Mã Phòng / Ghế:</span>
                  <span className="px-2.5 py-1 rounded-lg font-extrabold bg-indigo-600 text-white">
                    {inspectingBooking.nodeId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Tài khoản đăng ký:
                  </span>
                  <strong>
                    @{inspectingBooking.requesterUsername || 'User'} (
                    {inspectingBooking.requesterRole || 'EMPLOYEE'})
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email người đặt:
                  </span>
                  <strong>{inspectingBooking.userEmail}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Ngày & Khung giờ:
                  </span>
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    {inspectingBooking.bookingDateIso || 'Hôm nay'} •{' '}
                    {inspectingBooking.startTimeIso} –{' '}
                    {inspectingBooking.endTimeIso}
                  </strong>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-400 block mb-1">
                  Nội dung / Mục đích sử dụng phòng:
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
                    <span>
                      Quyền Admin: Xóa lịch đặt phòng này & Gửi thông báo đến
                      người đặt
                    </span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Nội dung lý do xóa (sẽ gửi thông báo cho{' '}
                      {inspectingBooking.userEmail}):
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
                    Xác nhận Xóa lịch đặt phòng & Gửi thông báo
                  </button>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectingBooking(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-extrabold transition"
                >
                  Đóng cửa sổ chi tiết
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};