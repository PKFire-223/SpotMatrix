import React from 'react';

interface ToastAlertBannerProps {
  alertMessage: string | null;
  alertType?: 'error' | 'success' | 'info';
  onDismissAlert: () => void;
}

export const ToastAlertBanner: React.FC<ToastAlertBannerProps> = ({
  alertMessage,
  alertType = 'info',
  onDismissAlert,
}) => {
  if (!alertMessage) return null;

  const badgeStyleMap = {
    error: 'bg-rose-950/90 border-rose-500 text-rose-100',
    success: 'bg-emerald-950/90 border-emerald-500 text-emerald-100',
    info: 'bg-indigo-950/90 border-indigo-500 text-indigo-100',
  };

  return (
    <div
      className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 border px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between transition-all ${badgeStyleMap[alertType]}`}
    >
      <span className="text-sm font-medium">{alertMessage}</span>
      <button
        onClick={onDismissAlert}
        className="ml-3 text-xs uppercase tracking-wider px-2 py-1 rounded bg-white/10 hover:bg-white/20"
      >
        Đóng
      </button>
    </div>
  );
};
