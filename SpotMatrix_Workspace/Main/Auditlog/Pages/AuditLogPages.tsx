import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Users,
  Activity,
  Lock,
  Unlock,
  Trash2,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  MapPin,
  FileCheck2,
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

interface AuditLogPagesProps {
  auditLogs: AuditConcurrencyLogItem[];
  managedUsers: ManagedUserAccountItem[];
  bookingsList?: BookingPayloadItem[];
  isDark: boolean;
  onToggleBlockUser: (username: string) => void;
  onDeleteUserAccount: (username: string) => void;
  onAdminOverrideBookingApproval?: (
    bookingId: string,
    nextDecision: 'APPROVED' | 'REJECTED'
  ) => void;
}

export const AuditLogPages: React.FC<AuditLogPagesProps> = ({
  auditLogs,
  managedUsers,
  bookingsList = [],
  isDark,
  onToggleBlockUser,
  onDeleteUserAccount,
  onAdminOverrideBookingApproval,
}) => {
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (selectedUserFilter !== 'ALL') {
        const matchActor =
          log.actorEmail.toLowerCase().includes(selectedUserFilter.toLowerCase()) ||
          log.detailMessage.toLowerCase().includes(selectedUserFilter.toLowerCase());
        if (!matchActor) return false;
      }
      if (searchQuery.trim() !== '') {
        const kw = searchQuery.toLowerCase();
        return (
          log.detailMessage.toLowerCase().includes(kw) ||
          log.targetNodeId.toLowerCase().includes(kw) ||
          log.eventCategory.toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [auditLogs, selectedUserFilter, searchQuery]);

  const cardSurface = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/90 text-slate-800 shadow-sm';

  return (
    <div className="space-y-6">
      <div
        className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${cardSurface}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold">
                Nhật ký Hoạt động Thời gian thực & Giám sát Tài khoản
              </h2>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                CHỈ DÀNH CHO ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Theo dõi hoạt động người dùng thời gian thực, ghi đè yêu cầu duyệt phòng và kiểm soát tài khoản
            </p>
          </div>
        </div>

        <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400">
          Đang Online: {managedUsers.filter((u) => u.isOnline).length}/{managedUsers.length} tài khoản
        </span>
      </div>

      {/* PHAN 1: QUYEN ADMIN SUA DOI / GHI DE YEU CAU DUYET DAT PHONG */}
      <div className={`p-5 rounded-2xl border space-y-3.5 ${cardSurface}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              Kiểm soát & Sửa đổi Yêu cầu Phê duyệt Đặt phòng (Quyền Tối cao ADMIN)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Admin có thể sửa đổi bất kỳ yêu cầu đặt phòng nào (kể cả yêu cầu đã được Quản lý xử lý trước đó)
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {bookingsList.map((bk) => (
            <div
              key={bk.bookingId}
              className={`p-3.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-extrabold">
                    {bk.nodeId}
                  </span>
                  <span className="font-bold">{bk.purposeNote}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      bk.approvalStatus === 'REJECTED'
                        ? 'bg-rose-500/15 text-rose-600'
                        : bk.approvalStatus === 'PENDING_APPROVAL'
                        ? 'bg-amber-500/15 text-amber-600'
                        : 'bg-teal-500/15 text-teal-600'
                    }`}
                  >
                    {bk.approvalStatus || 'APPROVED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Người đặt: <strong>{bk.userEmail}</strong> • Ca: {bk.startTimeIso} – {bk.endTimeIso}
                  {bk.approvedByUsername && ` • Xử lý bởi: @${bk.approvedByUsername}`}
                  {bk.checkedInAtIso && ` • Đã quét QR lúc: ${bk.checkedInAtIso}`}
                </p>
              </div>

              {onAdminOverrideBookingApproval && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onAdminOverrideBookingApproval(bk.bookingId, 'APPROVED')}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Chấp nhận (Override)
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdminOverrideBookingApproval(bk.bookingId, 'REJECTED')}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-[11px] flex items-center gap-1 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Từ chối / Thu hồi
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* PHAN 2: BANG GIAM SAT TAI KHOAN NGUOI DUNG THOI GIAN THUC */}
      <div className={`p-5 rounded-2xl border space-y-4 ${cardSurface}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Danh sách Tài khoản Người dùng & Theo dõi Thời gian thực
          </h3>
          {selectedUserFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedUserFilter('ALL')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              ✕ Đang lọc theo [{selectedUserFilter}] — Bấm để xem tất cả
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className={`border-b text-[11px] uppercase text-slate-400 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {managedUsers.map((user) => {
                const isRootAdmin = user.username.toLowerCase() === 'systemadmin123';
                const isSuspended = user.accountStatus === 'SUSPENDED';

                return (
                  <tr
                    key={user.username}
                    className={`transition ${
                      selectedUserFilter === user.username
                        ? isDark
                          ? 'bg-indigo-950/30'
                          : 'bg-indigo-50/60'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <p className="font-bold">{user.fullName}</p>
                      <p className="text-[11px] text-slate-400">
                        @{user.username} • {user.userEmail}
                      </p>
                    </td>

                    <td className="py-3 px-3">
                      {user.isOnline ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-600 dark:text-teal-400">
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                          Đang Online ({user.lastActiveText})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Offline ({user.lastActiveText})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {user.role}
                      </span>
                      <p className="text-[11px] text-slate-400">{user.departmentName}</p>
                    </td>

                    <td className="py-3 px-3">
                      <strong
                        className={`font-extrabold ${
                          user.trustScore >= 80
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-amber-600'
                        }`}
                      >
                        {user.trustScore} điểm
                      </strong>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          isSuspended
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                        }`}
                      >
                        {isSuspended ? 'ĐÃ CHẶN' : 'HOẠT ĐỘNG'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedUserFilter(
                              selectedUserFilter === user.username ? 'ALL' : user.username
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          Xem Hoạt động
                        </button>

                        {!isRootAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => onToggleBlockUser(user.username)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                                isSuspended
                                  ? 'bg-teal-600 text-white hover:bg-teal-500'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25'
                              }`}
                            >
                              {isSuspended ? (
                                <>
                                  <Unlock className="w-3.5 h-3.5" /> Mở khóa
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5" /> Chặn
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteUserAccount(user.username)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white transition"
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

      {/* PHAN 3: NHAT KY HOAT DONG CHI TIET */}
      <div className={`p-5 rounded-2xl border space-y-4 ${cardSurface}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              Nhật ký Hoạt động, Thời điểm Quét QR & Cập nhật Tọa độ ({filteredLogs.length} bản ghi)
            </h3>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã phòng, giờ quét QR, tài khoản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-100'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>
        </div>

        <div className="space-y-2.5 max-h-96 overflow-y-auto">
          {filteredLogs.map((log) => (
            <div
              key={log.auditId}
              className={`p-3.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 ${
                isDark
                  ? 'bg-slate-950/80 border-slate-800'
                  : 'bg-slate-50/70 border-slate-200/80'
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                      log.eventCategory === 'QR_CHECKIN_SUCCESS'
                        ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                        : log.outcomeStatus === 'CONFLICT_BLOCKED'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {log.eventCategory}
                  </span>
                  <span className="font-bold flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3 h-3" /> {log.targetNodeId}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(log.createdAtIso).toLocaleString('vi-VN')}
                  </span>
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  {log.detailMessage}
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-[11px] font-bold">
                Tài khoản: {log.actorEmail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};