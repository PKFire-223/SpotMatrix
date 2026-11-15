import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Send,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  NotificationRecordItem,
  UserRoleType,
  WebLanguageCodeType,
} from '../../../Shared/Types/GlobalSystemTypes';
import { NotificationPanelLayout } from '../Layout/NotificationPanelLayout';

interface NotificationCenterPagesProps {
  notifications: NotificationRecordItem[];
  userRole?: UserRoleType;
  webLanguage?: WebLanguageCodeType;
  isDark: boolean;
  onSelectAndNavigateNotification: (item: NotificationRecordItem) => void;
  onHandleApprovalDecision?: (bookingId: string, decision: 'APPROVED' | 'REJECTED') => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string) => void;
  onTriggerTestNotification: (title: string, content: string) => void;
}

const NOTIF_CENTER_I18N: Record<
  WebLanguageCodeType,
  {
    title: string;
    sub: string;
    allBtn: (c: number) => string;
    unreadBtn: (c: number) => string;
    markAllBtn: string;
    testHeader: string;
    sendTestBtn: string;
    emptyText: string;
    approveBtn: string;
    rejectBtn: string;
  }
> = {
  vi: {
    title: 'Trung tâm Thông báo & Phê duyệt Yêu cầu Đặt phòng',
    sub: 'Bấm vào thông báo để đi tới vị trí phòng họp • Quản lý & Admin có thể duyệt yêu cầu kèm lý do trực tiếp tại đây',
    allBtn: (c) => `Tất cả (${c})`,
    unreadBtn: (c) => `Chưa đọc (${c})`,
    markAllBtn: 'Đánh dấu đã đọc hết',
    testHeader: 'Phát Thông báo Nhắc lịch Nội bộ Nhanh:',
    sendTestBtn: 'Phát thông báo',
    emptyText: 'Hiện không có thông báo nào trong danh mục này.',
    approveBtn: 'Chấp nhận yêu cầu',
    rejectBtn: 'Từ chối yêu cầu',
  },
  en: {
    title: 'Notification Center & Room Booking Approvals',
    sub: 'Click any notification to jump to the room • Managers & Admins can approve or reject requests directly here',
    allBtn: (c) => `All (${c})`,
    unreadBtn: (c) => `Unread (${c})`,
    markAllBtn: 'Mark All as Read',
    testHeader: 'Broadcast Quick Internal Reminder:',
    sendTestBtn: 'Send Broadcast',
    emptyText: 'No notifications in this filter.',
    approveBtn: 'Approve Request',
    rejectBtn: 'Reject Request',
  },
  ja: {
    title: '通知センター＆会議室予約承認管理',
    sub: '通知をクリックして該当会議室へ移動 • マネージャーと管理者はここで申請理由を確認し承認・却下できます',
    allBtn: (c) => `すべて (${c})`,
    unreadBtn: (c) => `未読 (${c})`,
    markAllBtn: 'すべて既読にする',
    testHeader: '社内リマインダー通知のテスト送信:',
    sendTestBtn: '通知を送信',
    emptyText: '該当する通知はありません。',
    approveBtn: '承認する',
    rejectBtn: '却下する',
  },
};

export const NotificationCenterPages: React.FC<NotificationCenterPagesProps> = ({
  notifications = [],
  userRole = 'EMPLOYEE',
  webLanguage = 'vi',
  isDark,
  onSelectAndNavigateNotification,
  onHandleApprovalDecision,
  onMarkAllRead,
  onDeleteNotification,
  onTriggerTestNotification,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD'>('ALL');
  const [customTitle, setCustomTitle] = useState('Nhắc lịch Check-in QR phòng M1-01');
  const [customContent, setCustomContent] = useState(
    'Phòng M1-01 đã nằm trong khung giờ 30 phút trước giờ bắt đầu, mời bạn quét mã QR nhận phòng.'
  );
  const t = NOTIF_CENTER_I18N[webLanguage] || NOTIF_CENTER_I18N.vi;

  const canApprove = userRole === 'MANAGER' || userRole === 'SYS_ADMIN';
  const validNotifications = (Array.isArray(notifications) ? notifications : []).filter(
    (n) => n.category !== 'FLOORPLAN_UPDATE'
  );

  const displayedList =
    filterMode === 'UNREAD'
      ? validNotifications.filter((n) => !n.isRead)
      : validNotifications;

  const cardSurface = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/90 text-slate-800 shadow-sm';

  return (
    <NotificationPanelLayout>
      <div
        className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${cardSurface}`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold">{t.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.sub}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`inline-flex rounded-xl p-1 border text-xs ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filterMode === 'ALL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              {t.allBtn(validNotifications.length)}
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('UNREAD')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filterMode === 'UNREAD'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              {t.unreadBtn(validNotifications.filter((n) => !n.isRead).length)}
            </button>
          </div>

          <button
            type="button"
            onClick={onMarkAllRead}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            {t.markAllBtn}
          </button>
        </div>
      </div>

      <div className={`p-4 rounded-2xl border ${cardSurface}`}>
        <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3">
          {t.testHeader}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className={`md:col-span-4 px-3.5 py-2 rounded-xl border text-xs font-semibold ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-100'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          />
          <input
            type="text"
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
            className={`md:col-span-6 px-3.5 py-2 rounded-xl border text-xs ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-100'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          />
          <button
            type="button"
            onClick={() => {
              if (customTitle.trim()) {
                onTriggerTestNotification(customTitle.trim(), customContent.trim());
              }
            }}
            className="md:col-span-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Send className="w-3.5 h-3.5" />
            {t.sendTestBtn}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {displayedList.length === 0 ? (
          <div className={`p-8 rounded-2xl border text-center text-xs text-slate-400 ${cardSurface}`}>
            {t.emptyText}
          </div>
        ) : (
          displayedList.map((item) => {
            const isApprovalReq = Boolean(item.approvalBookingId);
            const isPending = item.approvalHandledStatus === 'PENDING';

            return (
              <div
                key={item.notificationId}
                className={`p-4 rounded-2xl border transition ${cardSurface} ${
                  !item.isRead ? 'ring-1 ring-indigo-500/40' : 'opacity-90'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    onClick={() => onSelectAndNavigateNotification(item)}
                    className="flex-1 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      {!item.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                      )}
                      <h3 className="text-sm font-bold group-hover:text-indigo-600 transition flex items-center gap-1.5">
                        {item.titleText}
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {item.contentText}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteNotification(item.notificationId)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {isApprovalReq && canApprove && onHandleApprovalDecision && (
                  <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                    {isPending ? (
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            onHandleApprovalDecision(item.approvalBookingId!, 'APPROVED')
                          }
                          className="py-1.5 px-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t.approveBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onHandleApprovalDecision(item.approvalBookingId!, 'REJECTED')
                          }
                          className="py-1.5 px-3.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 text-xs font-bold flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {t.rejectBtn}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        ✓ @{item.approvalHandledBy || 'Admin'} (
                        {item.approvalHandledStatus === 'APPROVED' ? 'APPROVED' : 'REJECTED'})
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </NotificationPanelLayout>
  );
};