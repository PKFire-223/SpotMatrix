import React, { useState, useMemo } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  ArrowLeft,
  QrCode,
  Calendar,
  Building2,
  User,
  FileText,
} from 'lucide-react';
import {
  BookingPayloadItem,
  UserRoleType,
  WebLanguageCodeType,
} from '../../../Shared/Types/GlobalSystemTypes';

export interface BookingHistoryPagesProps {
  bookingsList: BookingPayloadItem[];
  userEmail: string;
  userRole: UserRoleType;
  webLanguage?: WebLanguageCodeType;
  isDark?: boolean;
  onBackToBookingCalendar: () => void;
  onOpenQrKioskTab?: (booking: BookingPayloadItem, mode: 'CHECKIN' | 'CANCEL') => void;
}

type HistoryFilterTab = 'ALL' | 'CHECKED_IN' | 'CANCELLED' | 'EXPIRED_OR_REJECTED';

const HISTORY_I18N: Record<
  WebLanguageCodeType,
  {
    pageTitle: string;
    pageSub: string;
    backBtn: string;
    kpiCheckedIn: string;
    kpiCancelled: string;
    kpiExpired: string;
    kpiRejected: string;
    tabAll: (c: number) => string;
    tabCheckedIn: (c: number) => string;
    tabCancelled: (c: number) => string;
    tabExpiredRejected: (c: number) => string;
    searchPlaceholder: string;
    emptyText: string;
    badgeCheckedIn: (t: string) => string;
    badgeCancelledQr: (t: string) => string;
    badgeCancelledManual: (t: string) => string;
    badgeExpiredNoShow: (t: string) => string;
    badgeRejected: (by: string) => string;
    badgeActiveWaitQr: string;
    badgePendingApproval: string;
    requesterLabel: string;
    reasonLabel: string;
    retentionNote: string;
    viewQrReceiptBtn: string;
  }
> = {
  vi: {
    pageTitle: 'Trang Lịch sử Đặt phòng & Truy vết Trạng thái QR Chi tiết',
    pageSub:
      'Lưu trữ toàn bộ các đơn Đã quét QR nhận phòng, Đã hủy (qua QR hoặc thủ công), Trễ hạn tự động thu hồi (-10đ) và Bị từ chối phê duyệt.',
    backBtn: 'Quay lại Đặt lịch & Quét QR',
    kpiCheckedIn: 'Đã Quét QR Nhận Phòng (+2đ)',
    kpiCancelled: 'Đã Hủy (Quét QR / Thủ công)',
    kpiExpired: 'Trễ Hạn • Tự Động Thu Hồi (-10đ)',
    kpiRejected: 'Xin Phép Không Được Chấp Nhận',
    tabAll: (c) => `Tất cả Lịch sử (${c})`,
    tabCheckedIn: (c) => `Đã Quét QR (${c})`,
    tabCancelled: (c) => `Đã Hủy Phòng (${c})`,
    tabExpiredRejected: (c) => `Trễ Hạn / Từ Chối (${c})`,
    searchPlaceholder: 'Tìm mã phòng, mã vé, nội dung, email...',
    emptyText: 'Không có bản ghi lịch sử đặt phòng nào trong bộ lọc này.',
    badgeCheckedIn: (t) => `ĐÃ QUÉT QR NHẬN PHÒNG (${t})`,
    badgeCancelledQr: (t) => `ĐÃ HỦY BẰNG QUÉT QR (${t})`,
    badgeCancelledManual: (t) => `ĐÃ HỦY ĐẶT PHÒNG (${t})`,
    badgeExpiredNoShow: (t) => `TRỄ HẠN • ĐÃ THU HỒI PHÒNG & TRỪ 10Đ (${t})`,
    badgeRejected: (by) => `KHÔNG ĐƯỢC CHẤP NHẬN (Từ chối bởi @${by})`,
    badgeActiveWaitQr: 'ĐANG HOẠT ĐỘNG • CHỜ QUÉT QR',
    badgePendingApproval: 'ĐANG CHỜ PHÊ DUYỆT',
    requesterLabel: 'Tài khoản đặt:',
    reasonLabel: 'Lý do xin phép:',
    retentionNote:
      '* Quy tắc lưu vết: Các đơn Đã quét QR và Trễ hạn sẽ hiển thị ở khung Vé nhanh trong 3 ngày rồi tự động ẩn khỏi khung nhanh, nhưng luôn được lưu vĩnh viễn tại Trang Lịch sử này.',
    viewQrReceiptBtn: 'Xem Biên lai QR',
  },
  en: {
    pageTitle: 'Booking History & QR Verification Archive',
    pageSub:
      'Complete archive of QR Checked-in sessions, Cancelled bookings (via QR or manual), Expired No-Show auto-revocations (-10 pts), and Rejected requests.',
    backBtn: 'Back to Room Booking & QR',
    kpiCheckedIn: 'QR Checked-in (+2 pts)',
    kpiCancelled: 'Cancelled (QR / Manual)',
    kpiExpired: 'Expired • Auto-Revoked (-10 pts)',
    kpiRejected: 'Rejected Approval Requests',
    tabAll: (c) => `All History (${c})`,
    tabCheckedIn: (c) => `QR Checked-in (${c})`,
    tabCancelled: (c) => `Cancelled (${c})`,
    tabExpiredRejected: (c) => `Expired / Rejected (${c})`,
    searchPlaceholder: 'Search room code, booking ID, purpose, email...',
    emptyText: 'No booking history records match this filter.',
    badgeCheckedIn: (t) => `QR CHECKED IN (${t})`,
    badgeCancelledQr: (t) => `CANCELLED VIA QR SCAN (${t})`,
    badgeCancelledManual: (t) => `CANCELLED (${t})`,
    badgeExpiredNoShow: (t) => `EXPIRED NO-SHOW • AUTO-REVOKED -10 PTS (${t})`,
    badgeRejected: (by) => `REJECTED (By @${by})`,
    badgeActiveWaitQr: 'ACTIVE • AWAITING QR',
    badgePendingApproval: 'PENDING APPROVAL',
    requesterLabel: 'Requester:',
    reasonLabel: 'Permission Reason:',
    retentionNote:
      '* Retention Policy: Checked-in and Expired passes remain in the quick pass box for 3 days before archiving permanently on this History page.',
    viewQrReceiptBtn: 'View QR Receipt',
  },
  ja: {
    pageTitle: '予約履歴＆QRチェックイン・キャンセル・期限切れ詳細アーカイブ',
    pageSub:
      'QRチェックイン済、予約キャンセル（QR読取または手動）、期限切れ自動回収（-10点）、および承認却下された全履歴を管理します。',
    backBtn: '会議室予約＆QR画面へ戻る',
    kpiCheckedIn: 'QRチェックイン済 (+2点)',
    kpiCancelled: 'キャンセル済 (QR / 手動)',
    kpiExpired: '期限切れ・自動回収 (-10点)',
    kpiRejected: '承認却下リクエスト',
    tabAll: (c) => `全履歴 (${c})`,
    tabCheckedIn: (c) => `QR読取済 (${c})`,
    tabCancelled: (c) => `キャンセル済 (${c})`,
    tabExpiredRejected: (c) => `期限切れ / 却下 (${c})`,
    searchPlaceholder: '部屋コード、チケット番号、目的、メールで検索...',
    emptyText: '該当する予約履歴レコードはありません。',
    badgeCheckedIn: (t) => `QRチェックイン完了 (${t})`,
    badgeCancelledQr: (t) => `QR読取によるキャンセル完了 (${t})`,
    badgeCancelledManual: (t) => `キャンセル済 (${t})`,
    badgeExpiredNoShow: (t) => `期限切れ未チェックイン • 自動回収 -10点 (${t})`,
    badgeRejected: (by) => `承認却下 (@${by})`,
    badgeActiveWaitQr: '有効 • QR読取待機中',
    badgePendingApproval: '承認待ち',
    requesterLabel: '予約アカウント:',
    reasonLabel: '申請理由:',
    retentionNote:
      '* 保存ポリシー：QRチェックイン済および期限切れチケットはクイック枠に3日間表示された後、自動的にこの予約履歴ページへアーカイブされます。',
    viewQrReceiptBtn: 'QR控えを表示',
  },
};

export const BookingHistoryPages: React.FC<BookingHistoryPagesProps> = ({
  bookingsList,
  userEmail,
  userRole,
  webLanguage = 'vi',
  isDark = false,
  onBackToBookingCalendar,
  onOpenQrKioskTab,
}) => {
  const [activeTab, setActiveTab] = useState<HistoryFilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const t = HISTORY_I18N[webLanguage] || HISTORY_I18N.vi;

  const isSysAdmin = userRole === 'SYS_ADMIN';

  const scopedBookings = useMemo(() => {
    if (isSysAdmin || userRole === 'MANAGER') return bookingsList;
    return bookingsList.filter(
      (b) => b.userEmail.trim().toLowerCase() === userEmail.trim().toLowerCase()
    );
  }, [bookingsList, isSysAdmin, userRole, userEmail]);

  const counts = useMemo(() => {
    const checkedIn = scopedBookings.filter(
      (b) => b.bookingStatus === 'CHECKED_IN'
    ).length;
    const cancelled = scopedBookings.filter(
      (b) =>
        b.bookingStatus === 'CANCELLED' && b.approvalStatus !== 'REJECTED'
    ).length;
    const expired = scopedBookings.filter(
      (b) =>
        b.bookingStatus === 'EXPIRED_NO_SHOW' ||
        b.bookingStatus === 'AUTO_RELEASED'
    ).length;
    const rejected = scopedBookings.filter(
      (b) => b.approvalStatus === 'REJECTED'
    ).length;

    return {
      all: scopedBookings.length,
      checkedIn,
      cancelled,
      expired,
      rejected,
      expiredOrRejected: expired + rejected,
    };
  }, [scopedBookings]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedBookings.filter((b) => {
      if (activeTab === 'CHECKED_IN' && b.bookingStatus !== 'CHECKED_IN') {
        return false;
      }
      if (
        activeTab === 'CANCELLED' &&
        (b.bookingStatus !== 'CANCELLED' || b.approvalStatus === 'REJECTED')
      ) {
        return false;
      }
      if (
        activeTab === 'EXPIRED_OR_REJECTED' &&
        b.bookingStatus !== 'EXPIRED_NO_SHOW' &&
        b.bookingStatus !== 'AUTO_RELEASED' &&
        b.approvalStatus !== 'REJECTED'
      ) {
        return false;
      }

      if (!q) return true;
      return (
        b.nodeId.toLowerCase().includes(q) ||
        b.bookingId.toLowerCase().includes(q) ||
        b.purposeNote.toLowerCase().includes(q) ||
        b.userEmail.toLowerCase().includes(q) ||
        (b.departmentName || '').toLowerCase().includes(q)
      );
    });
  }, [scopedBookings, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
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
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-black tracking-tight">{t.pageTitle}</h1>
          </div>
          <p className="text-xs text-slate-400">{t.pageSub}</p>
        </div>

        <button
          type="button"
          onClick={onBackToBookingCalendar}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backBtn}</span>
        </button>
      </div>

      {/* 4 Thẻ KPI Thống kê Lịch sử */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-teal-100 shadow-sm'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400">
              {t.kpiCheckedIn}
            </p>
            <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-0.5">
              {counts.checkedIn}
            </p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-teal-500/30" />
        </div>

        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-amber-100 shadow-sm'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400">
              {t.kpiCancelled}
            </p>
            <p className="text-2xl font-black text-amber-500 mt-0.5">
              {counts.cancelled}
            </p>
          </div>
          <QrCode className="w-8 h-8 text-amber-500/30" />
        </div>

        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-rose-100 shadow-sm'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400">
              {t.kpiExpired}
            </p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {counts.expired}
            </p>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-500/30" />
        </div>

        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400">
              {t.kpiRejected}
            </p>
            <p className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-0.5">
              {counts.rejected}
            </p>
          </div>
          <XCircle className="w-8 h-8 text-slate-400/30" />
        </div>
      </div>

      {/* Bộ lọc Tabs & Tìm kiếm */}
      <div
        className={`p-5 rounded-3xl border space-y-4 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'ALL', label: t.tabAll(counts.all) },
                { id: 'CHECKED_IN', label: t.tabCheckedIn(counts.checkedIn) },
                { id: 'CANCELLED', label: t.tabCancelled(counts.cancelled) },
                {
                  id: 'EXPIRED_OR_REJECTED',
                  label: t.tabExpiredRejected(counts.expiredOrRejected),
                },
              ] as Array<{ id: HistoryFilterTab; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs font-semibold outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>
        </div>

        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
          {t.retentionNote}
        </p>

        {filteredRecords.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 border border-dashed rounded-2xl border-slate-300 dark:border-slate-800">
            {t.emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((bk) => {
              const isCheckedIn = bk.bookingStatus === 'CHECKED_IN';
              const isExpired =
                bk.bookingStatus === 'EXPIRED_NO_SHOW' ||
                bk.bookingStatus === 'AUTO_RELEASED';
              const isRejected = bk.approvalStatus === 'REJECTED';
              const isCancelled =
                bk.bookingStatus === 'CANCELLED' && !isRejected;

              return (
                <div
                  key={bk.bookingId}
                  className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition ${
                    isExpired
                      ? isDark
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : 'bg-rose-50/70 border-rose-200'
                      : isCheckedIn
                      ? isDark
                        ? 'bg-teal-950/15 border-teal-500/30'
                        : 'bg-teal-50/50 border-teal-200/80'
                      : isDark
                      ? 'bg-slate-950/80 border-slate-800'
                      : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-indigo-600 text-white">
                        {bk.nodeId}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        #{bk.bookingId}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isCheckedIn
                            ? 'bg-teal-500/15 text-teal-600 dark:text-teal-300'
                            : isExpired
                            ? 'bg-rose-600 text-white'
                            : isRejected
                            ? 'bg-slate-500/20 text-slate-600 dark:text-slate-300'
                            : isCancelled
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                            : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                        }`}
                      >
                        {isCheckedIn
                          ? t.badgeCheckedIn(bk.checkedInAtIso || 'Hôm nay')
                          : isExpired
                          ? t.badgeExpiredNoShow(
                              bk.expiredAtIso ||
                                bk.autoReleasedReason ||
                                'Quá 30p không quét QR'
                            )
                          : isRejected
                          ? t.badgeRejected(bk.approvedByUsername || 'Admin')
                          : isCancelled
                          ? bk.cancelledViaQr
                            ? t.badgeCancelledQr(bk.cancelledAtIso || 'Hôm nay')
                            : t.badgeCancelledManual(
                                bk.cancelledAtIso || 'Hôm nay'
                              )
                          : bk.approvalStatus === 'PENDING_APPROVAL'
                          ? t.badgePendingApproval
                          : t.badgeActiveWaitQr}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-extrabold">
                      {bk.purposeNote}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <strong>
                          {bk.bookingDateIso} ({bk.startTimeIso} – {bk.endTimeIso})
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-teal-500" />
                        <span>
                          {t.requesterLabel} <strong>{bk.userEmail}</strong>
                        </span>
                      </span>
                      {bk.departmentName && (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-amber-500" />
                          <span>{bk.departmentName}</span>
                        </span>
                      )}
                      {bk.qrToken && (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-indigo-500">
                          <Clock className="w-3 h-3" />
                          <span>{bk.qrToken}</span>
                        </span>
                      )}
                    </div>

                    {bk.approvalRequestReason && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          <strong>{t.reasonLabel}</strong> “
                          {bk.approvalRequestReason}”
                        </span>
                      </div>
                    )}
                  </div>

                  {onOpenQrKioskTab && (
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenQrKioskTab(bk, 'CHECKIN')}
                        className="px-3 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-300 text-xs font-extrabold flex items-center gap-1.5 transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{t.viewQrReceiptBtn}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
