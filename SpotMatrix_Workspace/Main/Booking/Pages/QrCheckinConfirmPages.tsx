import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  MapPin,
  UserCheck,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  CalendarCheck,
} from 'lucide-react';
import { SpotMatrixLogo } from '../../../Shared/Components/SpotMatrixLogo';

interface QrCheckinConfirmPagesProps {
  isDark?: boolean;
  onConfirmCheckinFromUrl?: (bookingId: string) => void;
}

export const QrCheckinConfirmPages: React.FC<QrCheckinConfirmPagesProps> = ({
  isDark = false,
  onConfirmCheckinFromUrl,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bookingId = searchParams.get('bookingId') || 'BK-2026-001';
  const roomCode = searchParams.get('room') || 'M1-01';
  const userEmail = searchParams.get('user') || 'employee.dev@spotmatrix.vn';
  const timeSlot = searchParams.get('time') || '08:00 - 10:00';
  const purposeNote = searchParams.get('purpose') || 'Họp triển khai dự án SpotMatrix';

  useEffect(() => {
    if (bookingId && onConfirmCheckinFromUrl) {
      onConfirmCheckinFromUrl(bookingId);
    }
    // Dong bo trang thai Check-in sang tab chinh qua localStorage
    localStorage.setItem('spotmatrix_last_qr_checkin_id', bookingId);
  }, [bookingId, onConfirmCheckinFromUrl]);

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 transition-colors ${
        isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#F4F7FB] text-slate-800'
      }`}
    >
      <div
        className={`max-w-lg w-full rounded-3xl border p-6 sm:p-8 shadow-2xl space-y-6 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
        }`}
      >
        {/* Header Logo */}
        <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
          <SpotMatrixLogo theme={isDark ? 'dark' : 'light'} variant="full" />
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-teal-500/15 text-teal-600 dark:text-teal-400">
            QR Verified
          </span>
        </div>

        {/* Huy hieu Xac nhan Thanh cong */}
        <div className="text-center space-y-2 py-2">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Xác nhận Check-in Đúng Hạn!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Hệ thống SpotMatrix đã ghi nhận bạn có mặt tại phòng họp đúng khung giờ đăng ký.
          </p>
        </div>

        {/* Thong tin chi tiet Phieu Check-in */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border space-y-3 text-xs ${
            isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50/90 border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400 font-semibold">Mã vé đặt lịch:</span>
            <strong className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">
              {bookingId}
            </strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Phòng họp / Vị trí:
            </span>
            <strong className="font-extrabold text-sm">{roomCode}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-500" /> Khung giờ đăng ký:
            </span>
            <strong className="font-bold">{timeSlot}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Tài khoản Check-in:
            </span>
            <strong className="font-bold">{userEmail}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-teal-500" /> Thời điểm quét QR:
            </span>
            <strong className="font-semibold">
              {new Date().toLocaleTimeString('vi-VN')} • Hôm nay
            </strong>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400 block mb-0.5">Nội dung cuộc họp:</span>
            <p className="font-semibold text-slate-700 dark:text-slate-200">{purposeNote}</p>
          </div>
        </div>

        {/* Thong bao cong diem tin nhiem */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
            isDark
              ? 'bg-teal-950/30 border-teal-500/30 text-teal-200'
              : 'bg-teal-50/80 border-teal-200 text-teal-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="font-semibold">
              Điểm Tín nhiệm của bạn vừa được cộng thêm <strong>+2 điểm</strong>!
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-teal-600 text-white font-black text-[10px]">
            +2 TRUST
          </span>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay về Bảng Điều khiển SpotMatrix
          </button>
        </div>

        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          Chứng thực tự động bởi SpotMatrix QR Check-in Gateway
        </div>
      </div>
    </div>
  );
};