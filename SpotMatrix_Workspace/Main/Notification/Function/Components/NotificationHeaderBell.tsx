import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, ExternalLink, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';
import {
  NotificationRecordItem,
  UserRoleType,
  WebLanguageCodeType,
} from '../../../../Shared/Types/GlobalSystemTypes';

interface NotificationHeaderBellProps {
  notifications: NotificationRecordItem[];
  userRole: UserRoleType;
  webLanguage?: WebLanguageCodeType;
  isDark: boolean;
  onSelectAndNavigateNotification: (item: NotificationRecordItem) => void;
  onHandleApprovalDecision?: (bookingId: string, decision: 'APPROVED' | 'REJECTED') => void;
  onMarkAllRead: () => void;
  onNavigateNotificationPage: () => void;
}

const BELL_I18N: Record<
  WebLanguageCodeType,
  {
    bellBtn: string;
    headerTitle: string;
    headerSub: string;
    markAllRead: string;
    approveBtn: string;
    rejectBtn: string;
    handledByPrefix: string;
    approvedTag: string;
    rejectedTag: string;
    viewAllBtn: string;
  }
> = {
  vi: {
    bellBtn: 'Thông báo',
    headerTitle: 'Thông báo & Yêu cầu phê duyệt',
    headerSub: 'Bấm vào thông báo để đi tới vị trí phát sinh',
    markAllRead: 'Đọc tất cả',
    approveBtn: 'Chấp nhận',
    rejectBtn: 'Từ chối',
    handledByPrefix: '✓ Yêu cầu đã được xử lý bởi',
    approvedTag: 'Đã chấp nhận',
    rejectedTag: 'Đã từ chối',
    viewAllBtn: 'Xem chi tiết hơn tại Trang Thông báo',
  },
  en: {
    bellBtn: 'Notifications',
    headerTitle: 'Notifications & Approval Requests',
    headerSub: 'Click any item to jump to its workspace room',
    markAllRead: 'Mark all read',
    approveBtn: 'Approve',
    rejectBtn: 'Reject',
    handledByPrefix: '✓ Processed by',
    approvedTag: 'Approved',
    rejectedTag: 'Rejected',
    viewAllBtn: 'Open Notification Center',
  },
  ja: {
    bellBtn: '通知',
    headerTitle: '通知＆予約承認リクエスト',
    headerSub: '通知をクリックして該当会議室へ移動',
    markAllRead: 'すべて既読',
    approveBtn: '承認する',
    rejectBtn: '却下する',
    handledByPrefix: '✓ 処理済み：',
    approvedTag: '承認済',
    rejectedTag: '却下済',
    viewAllBtn: '通知センターで詳細を見る',
  },
};

export const NotificationHeaderBell: React.FC<NotificationHeaderBellProps> = ({
  notifications,
  userRole,
  webLanguage = 'vi',
  isDark,
  onSelectAndNavigateNotification,
  onHandleApprovalDecision,
  onMarkAllRead,
  onNavigateNotificationPage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const t = BELL_I18N[webLanguage] || BELL_I18N.vi;

  const canApprove = userRole === 'MANAGER' || userRole === 'SYS_ADMIN';
  const cleanNotifications = notifications.filter(
    (n) => n.category !== 'FLOORPLAN_UPDATE'
  );
  const unreadCount = cleanNotifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-200 hover:border-indigo-500/50'
            : 'bg-white border-slate-200/90 text-slate-700 hover:border-indigo-300 shadow-sm'
        }`}
      >
        <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <span>{t.bellBtn}</span>
        {unreadCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl z-50 overflow-hidden transition-all ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-100'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div
            className={`px-4 py-3 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50/80'
            }`}
          >
            <div>
              <p className="text-xs font-extrabold">{t.headerTitle}</p>
              <p className="text-[11px] text-slate-400">{t.headerSub}</p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Check className="w-3 h-3" />
                {t.markAllRead}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {cleanNotifications.slice(0, 7).map((item) => {
              const isApprovalReq = Boolean(item.approvalBookingId);
              const isPendingApproval = item.approvalHandledStatus === 'PENDING';

              return (
                <div
                  key={item.notificationId}
                  className={`px-4 py-3 transition ${
                    !item.isRead
                      ? isDark
                        ? 'bg-indigo-950/20'
                        : 'bg-indigo-50/40'
                      : 'opacity-85'
                  }`}
                >
                  <div
                    onClick={() => {
                      setIsOpen(false);
                      onSelectAndNavigateNotification(item);
                    }}
                    className="cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        )}
                        <p className="text-xs font-bold truncate group-hover:text-indigo-600">
                          {item.titleText}
                        </p>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {item.contentText}
                    </p>
                  </div>

                  {isApprovalReq && canApprove && onHandleApprovalDecision && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      {isPendingApproval ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onHandleApprovalDecision(item.approvalBookingId!, 'APPROVED')
                            }
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> {t.approveBtn}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onHandleApprovalDecision(item.approvalBookingId!, 'REJECTED')
                            }
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 text-[11px] font-bold flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-3 h-3" /> {t.rejectBtn}
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] font-bold text-slate-400">
                          {t.handledByPrefix} @{item.approvalHandledBy || 'Admin'} (
                          {item.approvalHandledStatus === 'APPROVED'
                            ? t.approvedTag
                            : t.rejectedTag}
                          )
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            className={`px-4 py-2.5 border-t text-center ${
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50/80'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigateNotificationPage();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>{t.viewAllBtn}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};