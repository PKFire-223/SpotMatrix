import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2, Send } from 'lucide-react';
import { NotificationRecordItem } from '../../../Shared/Types/GlobalSystemTypes';
import { NotificationPanelLayout } from '../Layout/NotificationPanelLayout';

interface NotificationCenterPagesProps {
  notifications: NotificationRecordItem[];
  isDark: boolean;
  onMarkOneRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string) => void;
  onTriggerTestNotification: (title: string, content: string) => void;
}

export const NotificationCenterPages: React.FC<NotificationCenterPagesProps> = ({
  notifications,
  isDark,
  onMarkOneRead,
  onMarkAllRead,
  onDeleteNotification,
  onTriggerTestNotification,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD'>('ALL');
  const [customTitle, setCustomTitle] = useState('Nhắc lịch Check-in QR bàn A-01');
  const [customContent, setCustomContent] = useState(
    'Bạn còn 10 phút để quét mã QR nhận bàn A-01 trước khi hệ thống tự động giải phóng chỗ.'
  );

  const displayedList =
    filterMode === 'UNREAD' ? notifications.filter((n) => !n.isRead) : notifications;

  const cardSurface = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/90 text-slate-800 shadow-sm';

  return (
    <NotificationPanelLayout>
      {/* Thanh tieu de & Bo loc diu mat */}
      <div className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${cardSurface}`}>
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <Bell className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </div>
          <div>
            <h2 className="text-base font-bold">Trung tâm Thông báo Hệ thống</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cập nhật trạng thái đặt chỗ, cảnh báo giữ ghế 5 phút và biến động điểm tín nhiệm
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
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filterMode === 'ALL'
                  ? isDark
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('UNREAD')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filterMode === 'UNREAD'
                  ? isDark
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Chưa đọc ({notifications.filter((n) => !n.isRead).length})
            </button>
          </div>

          <button
            type="button"
            onClick={onMarkAllRead}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition ${
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

      {/* Khung thu phat Thong bao Pop-up Realtime */}
      <div className={`p-4 rounded-2xl border ${cardSurface}`}>
        <p className="text-xs font-bold mb-2.5 text-slate-500 dark:text-slate-400">
          Mô phỏng phát Thông báo Realtime (Sẽ bật Pop-up êm dịu ở góc màn hình & lưu vào MongoDB):
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Tiêu đề thông báo..."
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
            placeholder="Nội dung chi tiết..."
            className={`sm:col-span-6 px-3 py-2 rounded-xl border text-xs ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-100'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          />
          <button
            type="button"
            onClick={() => onTriggerTestNotification(customTitle, customContent)}
            className={`sm:col-span-2 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              isDark
                ? 'bg-slate-100 text-slate-900 hover:bg-white'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Phát thử
          </button>
        </div>
      </div>

      {/* Danh sach Thong bao chi tiet */}
      <div className={`rounded-2xl border divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden ${cardSurface}`}>
        {displayedList.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            Hiện không có thông báo nào trong danh mục này.
          </div>
        ) : (
          displayedList.map((item) => (
            <div
              key={item.notificationId}
              className={`p-4 flex items-start justify-between gap-4 transition ${
                !item.isRead
                  ? isDark
                    ? 'bg-slate-800/30'
                    : 'bg-slate-50/80'
                  : 'opacity-80'
              }`}
            >
              <div
                onClick={() => onMarkOneRead(item.notificationId)}
                className="flex items-start gap-3 cursor-pointer flex-1"
              >
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                    !item.isRead
                      ? 'bg-slate-800 dark:bg-slate-200'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold">{item.titleText}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-400'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      {item.category}
                    </span>
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
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