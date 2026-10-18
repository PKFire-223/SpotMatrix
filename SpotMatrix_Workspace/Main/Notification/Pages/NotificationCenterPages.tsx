import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2, Send, ArrowUpRight } from 'lucide-react';
import { NotificationRecordItem } from '../../../Shared/Types/GlobalSystemTypes';
import { NotificationPanelLayout } from '../Layout/NotificationPanelLayout';

interface NotificationCenterPagesProps {
  notifications: NotificationRecordItem[];
  isDark: boolean;
  onSelectAndNavigateNotification: (item: NotificationRecordItem) => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string) => void;
  onTriggerTestNotification: (title: string, content: string) => void;
}

export const NotificationCenterPages: React.FC<NotificationCenterPagesProps> = ({
  notifications,
  isDark,
  onSelectAndNavigateNotification,
  onMarkAllRead,
  onDeleteNotification,
  onTriggerTestNotification,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD'>('ALL');
  const [customTitle, setCustomTitle] = useState('Nhắc lịch Check-in QR bàn A-01');
  const [customContent, setCustomContent] = useState(
    'Bạn còn 10 phút để quét mã QR nhận bàn A-01 trước khi hệ thống tự động giải phóng chỗ.'
  );

  // Loai bo thong bao cap nhat toa do (vi da chuyen sang Nhat ky hoat dong Admin)
  const validNotifications = notifications.filter(
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
            <h2 className="text-base font-extrabold">Trung tâm Thông báo Cá nhân</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bấm trực tiếp vào bất kỳ thông báo nào để di chuyển tới bàn/phòng họp hoặc lịch đặt chỗ tương ứng
            </p>
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
                filterMode === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Tất cả ({validNotifications.length})
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
              Chưa đọc ({validNotifications.filter((n) => !n.isRead).length})
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
            Đánh dấu đã đọc hết
          </button>
        </div>
      </div>

      <div className={`p-4 rounded-2xl border ${cardSurface}`}>
        <p className="text-xs font-bold mb-2.5 text-slate-500 dark:text-slate-400">
          Mô phỏng phát Thông báo Realtime (Bật Pop-up êm dịu & gắn liên kết di chuyển tới bàn A-01):
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className={`sm:col-span-4 px-3 py-2 rounded-xl border text-xs ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-100'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          />
          <input
            type="text"
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
            className={`sm:col-span-6 px-3 py-2 rounded-xl border text-xs ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-100'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          />
          <button
            type="button"
            onClick={() => onTriggerTestNotification(customTitle, customContent)}
            className="sm:col-span-2 py-2 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" />
            Phát thử
          </button>
        </div>
      </div>

      <div
        className={`rounded-2xl border divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden ${cardSurface}`}
      >
        {displayedList.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            Hiện không có thông báo nào trong danh mục này.
          </div>
        ) : (
          displayedList.map((item) => (
            <div
              key={item.notificationId}
              className={`p-4 flex items-start justify-between gap-4 transition group ${
                !item.isRead
                  ? isDark
                    ? 'bg-indigo-950/15 hover:bg-indigo-950/30'
                    : 'bg-indigo-50/30 hover:bg-indigo-50/70'
                  : 'opacity-80 hover:opacity-100'
              }`}
            >
              <div
                onClick={() => onSelectAndNavigateNotification(item)}
                className="flex items-start gap-3 cursor-pointer flex-1"
              >
                <span
                  className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                    !item.isRead ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1">
                      {item.titleText}
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                    </span>
                    {item.relatedNodeId && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                        Đi tới: {item.relatedNodeId}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.createdAtIso).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.contentText}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDeleteNotification(item.notificationId)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition"
                title="Xóa thông báo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </NotificationPanelLayout>
  );
};