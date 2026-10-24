import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
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
  QrCode,
  BellRing,
  AlertTriangle,
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
  onAdminOverrideBookingApproval,
  onAdminDeleteBookingWithNotification,
}) => {
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [inspectingBooking, setInspectingBooking] =
    useState<BookingPayloadItem | null>(null);
  const [adminDeleteReason, setAdminDeleteReason] = useState<string>(
    'Quản trị viên thu hồi lịch đặt phòng để điều phối sự kiện ưu tiên của hệ thống.'
  );
  const [adminActionBanner, setAdminActionBanner] = useState<string | null>(null);

  const onlineUsersCount = useMemo(() => {
    return managedUsers.filter((u) => u.isOnline).length;
  }, [managedUsers]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((item) => {
      const matchUser =
        selectedUserFilter === 'ALL' ||
        item.actorEmail.toLowerCase().includes(selectedUserFilter.toLowerCase());
      const matchKey =
        !searchKeyword.trim() ||
        item.detailMessage.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.targetNodeId.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.actorEmail.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchUser && matchKey;
    });
  }, [auditLogs, selectedUserFilter, searchKeyword]);

  const handleConfirmDeleteBookingFromModal = () => {
    if (!inspectingBooking) return;
    const reasonToUse =
      adminDeleteReason.trim() ||
      'Quản trị viên xóa lịch đặt phòng theo yêu cầu điều phối hệ thống.';

    if (onAdminDeleteBookingWithNotification) {
      onAdminDeleteBookingWithNotification(inspectingBooking.bookingId, reasonToUse);
    } else {
      onAdminOverrideBookingApproval(inspectingBooking.bookingId, 'REJECTED');
    }

    setAdminActionBanner(
      `Đã xóa lịch đặt phòng [${inspectingBooking.bookingId} - Vị trí ${inspectingBooking.nodeId}] và gửi thông báo kèm lý do trực tiếp đến người đặt (${inspectingBooking.userEmail}).`
    );
    setInspectingBooking(null);
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
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Nhật ký Hoạt động Thời gian thực & Giám sát Tài khoản
              </h1>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                CHỈ DÀNH CHO ADMIN
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Theo dõi trạng thái đăng nhập thực tế, xem chi tiết/thu hồi lịch đặt phòng và kiểm soát tài khoản
            </p>
          </div>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
          Đang Online: {onlineUsersCount}/{managedUsers.length} tài khoản
        </span>
      </div>

      {adminActionBanner && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold ${
            isDark
              ? 'bg-teal-950/30 border-teal-500/40 text-teal-200'
              : 'bg-teal-50 border-teal-200 text-teal-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{adminActionBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setAdminActionBanner(null)}
            className="underline text-[11px] shrink-0"
          >
            Đóng
          </button>
        </div>
      )}

      {/* KHU VỰC 1: DANH SÁCH ĐĂNG KÝ ĐẶT PHÒNG (ĐƠN ĐÃ DUYỆT CHỈ HIỆN NÚT XEM CHI TIẾT) */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div>
          <h2
            className={`text-sm font-extrabold flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            Danh sách Đăng ký Đặt phòng Toàn hệ thống (Quyền Tối cao ADMIN)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Các đơn đã phê duyệt chỉ hiển thị nút Xem chi tiết. Trong cửa sổ Xem chi tiết, Admin có thể xóa lịch đặt phòng và gửi thông báo đến người đặt.
          </p>
        </div>

        {bookingsList.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border rounded-2xl border-dashed border-slate-300 dark:border-slate-800">
            Hiện không có lịch đặt phòng nào trong hệ thống.
          </div>
        ) : (
          <div className="space-y-3">
            {bookingsList.map((bk) => {
              const isPending = bk.approvalStatus === 'PENDING_APPROVAL';
              const isApproved = bk.approvalStatus === 'APPROVED' || !bk.approvalStatus;
              const isRejected = bk.approvalStatus === 'REJECTED';

              return (
                <div
                  key={bk.bookingId}
                  className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 transition ${
                    isDark
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-indigo-600 text-white">
                        {bk.nodeId}
                      </span>
                      <span className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {bk.purposeNote}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          isApproved
                            ? 'bg-teal-500/15 text-teal-600 dark:text-teal-300'
                            : isRejected
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                        }`}
                      >
                        {isApproved
                          ? 'ĐÃ PHÊ DUYỆT (APPROVED)'
                          : isRejected
                          ? 'ĐÃ TỪ CHỐI'
                          : 'ĐANG CHỜ PHÊ DUYỆT'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Mã vé: <strong>{bk.bookingId}</strong> • Người đặt: <strong>{bk.userEmail}</strong> • Ca: {bk.startTimeIso} – {bk.endTimeIso} ({bk.bookingDateIso || 'Hôm nay'}){' '}
                      {bk.approvedByUsername ? `• Xử lý bởi: @${bk.approvedByUsername}` : ''}{' '}
                      {bk.checkedInAtIso ? `• Đã quét QR lúc: ${bk.checkedInAtIso}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => onAdminOverrideBookingApproval(bk.bookingId, 'APPROVED')}
                          className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Phê duyệt
                        </button>
                        <button
                          type="button"
                          onClick={() => onAdminOverrideBookingApproval(bk.bookingId, 'REJECTED')}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 hover:bg-rose-500/25 text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Từ chối
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setInspectingBooking(bk);
                        setAdminDeleteReason(
                          `Quản trị viên thu hồi vị trí ${bk.nodeId} (Ca ${bk.startTimeIso} – ${bk.endTimeIso}) để điều phối lịch ưu tiên của hệ thống.`
                        );
                      }}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                        isDark
                          ? 'bg-slate-900 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20'
                          : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KHU VỰC 2: DANH SÁCH TÀI KHOẢN NGƯỜI DÙNG & TRẠNG THÁI ONLINE THỰC TẾ */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <h2
            className={`text-sm font-extrabold flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            Danh sách Tài khoản Người dùng & Trạng thái Đăng nhập Thực tế
          </h2>
          {selectedUserFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedUserFilter('ALL')}
              className="text-xs font-bold text-indigo-600 underline"
            >
              Hiển thị tất cả tài khoản
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className={`border-b text-[11px] font-extrabold uppercase ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-400'
                }`}
              >
                <th className="py-3 px-3">Người dùng & Tài khoản</th>
                <th className="py-3 px-3">Trạng thái Mạng</th>
                <th className="py-3 px-3">Vai trò & Phòng ban</th>
                <th className="py-3 px-3">Điểm Tín nhiệm</th>
                <th className="py-3 px-3">Trạng thái Khóa</th>
                <th className="py-3 px-3 text-right">Thao tác Quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
              {managedUsers.map((u) => {
                const isSelfAdmin = u.role === 'SYS_ADMIN';
                return (
                  <tr key={u.username}>
                    <td className="py-3.5 px-3">
                      <p className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {u.fullName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        @{u.username} • {u.userEmail}
                      </p>
                    </td>
                    <td className="py-3.5 px-3">
                      {u.isOnline ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300">
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                          Đang Online ({u.lastActiveText})
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Ngoại tuyến ({u.lastActiveText || 'Chưa đăng nhập'})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-extrabold text-indigo-600 dark:text-indigo-400">
                        {u.role}
                      </p>
                      <p className="text-[11px] text-slate-400">{u.departmentName}</p>
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-teal-600 dark:text-teal-400">
                      {u.trustScore} điểm
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                          u.accountStatus === 'SUSPENDED'
                            ? 'bg-rose-500/15 text-rose-600'
                            : 'bg-teal-500/15 text-teal-600'
                        }`}
                      >
                        {u.accountStatus === 'SUSPENDED' ? 'ĐÃ ĐÌNH CHỈ' : 'HOẠT ĐỘNG'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedUserFilter(u.userEmail)}
                          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 ${
                            isDark
                              ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
                              : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem Hoạt động
                        </button>
                        {!isSelfAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => onToggleBlockUser(u.username)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 text-[11px] font-bold flex items-center gap-1"
                            >
                              {u.accountStatus === 'SUSPENDED' ? (
                                <>
                                  <Unlock className="w-3.5 h-3.5" />
                                  Mở khóa
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5" />
                                  Chặn
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteUserAccount(u.username)}
                              className="p-1.5 rounded-xl bg-rose-500/15 text-rose-600 hover:bg-rose-500/25"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
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

      {/* KHU VỰC 3: NHẬT KÝ HOẠT ĐỘNG */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            className={`text-sm font-extrabold flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-teal-600" />
            Nhật ký Hoạt động, Thời điểm Quét QR & Xung đột Tọa độ ({filteredAuditLogs.length} bản ghi)
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo mã phòng, email, sự kiện..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>
        </div>

        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {filteredAuditLogs.map((log) => (
            <div
              key={log.auditId}
              className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
                log.outcomeStatus === 'CONFLICT_BLOCKED' ||
                log.outcomeStatus === 'AUTO_REVOKED'
                  ? isDark
                    ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                    : 'bg-rose-50/60 border-rose-200 text-rose-900'
                  : isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-50/80 border-slate-200/80 text-slate-800'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold">
                    {log.targetNodeId}
                  </span>
                  <span className="font-extrabold">{log.eventCategory}</span>
                  <span className="text-slate-400">• {log.actorEmail}</span>
                </div>
                <p className="font-medium leading-relaxed">{log.detailMessage}</p>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">
                {new Date(log.createdAtIso).toLocaleTimeString('vi-VN')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT LỊCH ĐẶT PHÒNG & XÓA LỊCH KÈM GỬI THÔNG BÁO (DÀNH RIÊNG CHO SYS_ADMIN) */}
      {inspectingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-indigo-100 text-slate-800'
            }`}
          >
            <div className="p-5 bg-indigo-600 text-white flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-extrabold uppercase">
                  Chi tiết Đăng ký Đặt phòng • Quyền SYS_ADMIN
                </span>
                <h3 className="text-base font-extrabold mt-1">
                  Mã vé: {inspectingBooking.bookingId} — Vị trí {inspectingBooking.nodeId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingBooking(null)}
                className="p-1.5 rounded-xl hover:bg-white/15 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    Nội dung cuộc họp:
                  </span>
                  <strong className="font-extrabold text-right">
                    {inspectingBooking.purposeNote}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    Tài khoản đăng ký:
                  </span>
                  <strong>
                    @{inspectingBooking.requesterUsername || 'Thành viên'} (
                    {inspectingBooking.requesterRole || 'EMPLOYEE'})
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    Email nhận thông báo:
                  </span>
                  <strong>{inspectingBooking.userEmail}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    Ngày & Khung giờ:
                  </span>
                  <strong>
                    {inspectingBooking.bookingDateIso || 'Hôm nay'} •{' '}
                    {inspectingBooking.startTimeIso} – {inspectingBooking.endTimeIso}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-teal-500" />
                    Trạng thái Check-in QR:
                  </span>
                  <strong className="text-teal-600 dark:text-teal-400">
                    {inspectingBooking.bookingStatus === 'CHECKED_IN'
                      ? `Đã quét QR lúc ${inspectingBooking.checkedInAtIso}`
                      : 'Chưa quét mã QR Check-in'}
                  </strong>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-rose-950/25 border-rose-500/30' : 'bg-rose-50/70 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-300 font-extrabold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Quyền Admin: Xóa Lịch Đặt Phòng & Gửi Thông Báo Đến Người Đặt</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Nhập lý do xóa / thu hồi lịch (sẽ gửi thông báo tới {inspectingBooking.userEmail}):
                  </label>
                  <textarea
                    rows={2}
                    value={adminDeleteReason}
                    onChange={(e) => setAdminDeleteReason(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-rose-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setInspectingBooking(null)}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold ${
                      isDark
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Đóng lại
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteBookingFromModal}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa Lịch Đặt Này & Gửi Thông Báo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};