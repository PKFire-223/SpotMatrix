import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { NotificationRecordItem } from '../../../../Shared/Types/GlobalSystemTypes';

interface NotificationHeaderBellProps {
  notifications: NotificationRecordItem[];
  isDark: boolean;
  onMarkOneRead: (notificationId: string) => void;
  onMarkAllRead: () => void;
  onNavigateNotificationPage: () => void;
}

export const NotificationHeaderBell: React.FC<NotificationHeaderBellProps> = ({
  notifications,
  isDark,
  onMarkOneRead,
  onMarkAllRead,
  onNavigateNotificationPage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
        className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
            : 'bg-slate-100/80 border-slate-200/90 text-slate-700 hover:bg-slate-200/60'
        }`}
        title="Thông báo hệ thống"
      >
        <Bell className="w-3.5 h-3.5" />
        <span>Thông báo</span>
        {unreadCount > 0 && (
          <span
            className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              isDark
                ? 'bg-slate-200 text-slate-900'
                : 'bg-slate-800 text-white'
            }`}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Hop xo xuong (Popover) mau diu mat */}
      {isOpen && (
        <div
          className={`absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-xl z-50 overflow-hidden transition-all ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-100'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div
            className={`px-4 py-3 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/70'
            }`}
          >
            <div>
              <p className="text-xs font-bold">Thông báo gần đây</p>
              <p className="text-[11px] text-slate-400">
                {unreadCount > 0 ? `Có ${unreadCount} thông báo chưa đọc` : 'Đã đọc tất cả'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <Check className="w-3 h-3" />
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {notifications.slice(0, 6).map((item) => (
              <div
                key={item.notificationId}
                onClick={() => onMarkOneRead(item.notificationId)}
                className={`px-4 py-3 cursor-pointer transition ${
                  !item.isRead
                    ? isDark
                      ? 'bg-slate-800/40 hover:bg-slate-800/70'
                      : 'bg-slate-50/90 hover:bg-slate-100/80'
                    : isDark
                    ? 'hover:bg-slate-800/20 opacity-75'
                    : 'hover:bg-slate-50 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-slate-700 dark:bg-slate-300 shrink-0" />
                    )}
                    <p className="text-xs font-bold truncate">{item.titleText}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(item.createdAtIso).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {item.contentText}
                </p>
              </div>
            ))}
          </div>

          <div
            className={`px-4 py-2.5 border-t text-center ${
              isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/70'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigateNotificationPage();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:underline"
            >
              <span>Mở Trang Quản lý Thông báo</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};