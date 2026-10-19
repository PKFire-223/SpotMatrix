import React from 'react';
import { Bell, X } from 'lucide-react';
import { NotificationRecordItem } from '../../../../Shared/Types/GlobalSystemTypes';

interface RealtimePopupToastProps {
  activePopup: NotificationRecordItem | null;
  isDark: boolean;
  onDismissPopup: () => void;
  onOpenNotificationPage: () => void;
}

export const RealtimePopupToast: React.FC<RealtimePopupToastProps> = ({
  activePopup,
  isDark,
  onDismissPopup,
  onOpenNotificationPage,
}) => {
  if (!activePopup) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 w-80 sm:w-96 rounded-2xl border p-4 shadow-lg transition-all duration-300 ${
        isDark
          ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-black/40'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-slate-300'
              : 'bg-slate-100 border-slate-200/80 text-slate-700'
          }`}
        >
          <Bell className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Thông báo thời gian thực • Vừa xong
            </span>
            <button
              type="button"
              onClick={onDismissPopup}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs font-bold mt-1 truncate">{activePopup.titleText}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
            {activePopup.contentText}
          </p>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                onDismissPopup();
                onOpenNotificationPage();
              }}
              className="font-semibold text-slate-700 dark:text-slate-300 hover:underline"
            >
              Xem trong Trung tâm Thông báo →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};