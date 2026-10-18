import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, ExternalLink, ArrowUpRight } from 'lucide-react';
import { NotificationRecordItem } from '../../../../Shared/Types/GlobalSystemTypes';

interface NotificationHeaderBellProps {
  notifications: NotificationRecordItem[];
  isDark: boolean;
  onSelectAndNavigateNotification: (item: NotificationRecordItem) => void;
  onMarkAllRead: () => void;
  onNavigateNotificationPage: () => void;
}

export const NotificationHeaderBell: React.FC<NotificationHeaderBellProps> = ({
  notifications,
  isDark,
  onSelectAndNavigateNotification,
  onMarkAllRead,
  onNavigateNotificationPage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Chi hien thi thong bao nghiep vu, khong hien thong bao cap nhat toa do
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
        className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-200 hover:border-indigo-500/50'
            : 'bg-white border-slate-200/90 text-slate-700 hover:border-indigo-300 shadow-sm'
        }`}
      >
        <Bell className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>Thông báo</span>
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
              <p className="text-xs font-extrabold">Thông báo của bạn</p>
              <p className="text-[11px] text-slate-400">
                Bấm vào thông báo để đi tới vị trí phát sinh
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Check className="w-3 h-3" />
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {cleanNotifications.slice(0, 6).map((item) => (
              <div
                key={item.notificationId}
                onClick={() => {
                  setIsOpen(false);
                  onSelectAndNavigateNotification(item);
                }}
                className={`px-4 py-3 cursor-pointer transition group ${
                  !item.isRead
                    ? isDark
                      ? 'bg-indigo-950/20 hover:bg-indigo-950/40'
                      : 'bg-indigo-50/40 hover:bg-indigo-50/80'
                    : isDark
                    ? 'hover:bg-slate-800/40 opacity-80'
                    : 'hover:bg-slate-50 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                    <p className="text-xs font-bold truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {item.titleText}
                    </p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {item.contentText}
                </p>
              </div>
            ))}
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
              <span>Xem chi tiết hơn tại Trang Thông báo</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};