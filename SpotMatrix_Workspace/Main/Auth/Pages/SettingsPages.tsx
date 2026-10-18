import React, { useState } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Bell,
  Lock,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  Box,
  Clock,
} from 'lucide-react';
import { UserRoleType } from '../../../Shared/Types/GlobalSystemTypes';

interface SettingsPagesProps {
  isDark: boolean;
  userRole: UserRoleType;
  onToggleTheme: () => void;
}

export const SettingsPages: React.FC<SettingsPagesProps> = ({
  isDark,
  userRole,
  onToggleTheme,
}) => {
  const [defaultFloor, setDefaultFloor] = useState<number>(1);
  const [graphicsQuality, setGraphicsQuality] = useState<'HIGH' | 'BALANCED'>('HIGH');
  const [enableRealtimePopup, setEnableRealtimePopup] = useState<boolean>(true);
  const [reminderMinutes, setReminderMinutes] = useState<number>(30);

  // Chính sách đặt phòng (Admin có thể chỉnh sửa)
  const [earlyCheckinHours, setEarlyCheckinHours] = useState<number>(2);
  const [holdMinutes, setHoldMinutes] = useState<number>(5);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState<number>(15);

  // Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string | null>(null);

  const isSysAdmin = userRole === 'SYS_ADMIN';

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSavedMsg('Đã lưu cấu hình cài đặt hệ thống thành công!');
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setSettingsSavedMsg(null), 3500);
  };

  const cardSurface = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/90 text-slate-800 shadow-sm';

  const inputSurface = isDark
    ? 'bg-slate-950 border-slate-800 text-slate-100'
    : 'bg-slate-50 border-slate-200 text-slate-800';

  return (
    <form onSubmit={handleSaveSettings} className="space-y-6">
      <div
        className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${cardSurface}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold">
              Cài đặt Hệ thống, Đồ họa 3D & Bảo mật Tài khoản
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tùy chỉnh trải nghiệm giao diện, thông báo nhắc lịch QR và quy định vận hành phòng họp
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition"
        >
          Lưu Toàn bộ Cài đặt
        </button>
      </div>

      {settingsSavedMsg && (
        <div className="p-3.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{settingsSavedMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. CAI DAT GIAO DIEN & ENGINE DO HOA 3D */}
        <div className={`p-5 rounded-2xl border space-y-4 ${cardSurface}`}>
          <h3 className="text-sm font-extrabold flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
            <Box className="w-4 h-4 text-indigo-600" />
            1. Giao diện & Hiển thị Mô hình 3D
          </h3>

          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-bold">Chế độ Màu sắc Giao diện</p>
              <p className="text-[11px] text-slate-400">
                Chuyển đổi giữa nền Sáng (#F4F7FB) và nền Tối (#0B1120)
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-2"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" /> Đang bật Tối
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" /> Đang bật Sáng
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold mb-1">Tầng mặc định khi mở Sơ đồ 3D</label>
              <select
                value={defaultFloor}
                onChange={(e) => setDefaultFloor(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border font-semibold ${inputSurface}`}
              >
                <option value={1}>Tầng 1 (6 Phòng họp chuẩn)</option>
                <option value={2}>Tầng 2 (6 Phòng họp chuẩn)</option>
                <option value={3}>Tầng 3 (6 Phòng họp chuẩn)</option>
                <option value={4}>Tầng 4 (6 Phòng họp chuẩn)</option>
                <option value={5}>Tầng 5 (Hội trường Đấu trường La Mã)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">Chất lượng Khử răng cưa 3D (WebGL)</label>
              <select
                value={graphicsQuality}
                onChange={(e) => setGraphicsQuality(e.target.value as 'HIGH' | 'BALANCED')}
                className={`w-full px-3 py-2 rounded-xl border font-semibold ${inputSurface}`}
              >
                <option value="HIGH">Cao (Đổ bóng mềm PCFSoftShadow)</option>
                <option value="BALANCED">Cân bằng (Tối ưu cho máy cấu hình nhẹ)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. CAI DAT THONG BAO & NHAC LICH CHECK-IN QR */}
        <div className={`p-5 rounded-2xl border space-y-4 ${cardSurface}`}>
          <h3 className="text-sm font-extrabold flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
            <Bell className="w-4 h-4 text-teal-600" />
            2. Cài đặt Thông báo & Nhắc giờ Quét QR
          </h3>

          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-bold">Hiển thị Pop-up Thông báo Realtime</p>
              <p className="text-[11px] text-slate-400">
                Tự động bật thông báo góc dưới bên phải khi có kết quả duyệt phòng
              </p>
            </div>
            <input
              type="checkbox"
              checked={enableRealtimePopup}
              onChange={(e) => setEnableRealtimePopup(e.target.checked)}
              className="w-4 h-4 accent-indigo-600"
            />
          </div>

          <div className="text-xs">
            <label className="block font-bold mb-1">
              Thời gian gửi thông báo nhắc trước giờ mở Check-in QR
            </label>
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(Number(e.target.value))}
              className={`w-full px-3 py-2 rounded-xl border font-semibold ${inputSurface}`}
            >
              <option value={15}>Nhắc trước 15 phút</option>
              <option value={30}>Nhắc trước 30 phút</option>
              <option value={60}>Nhắc trước 1 tiếng</option>
              <option value={120}>Nhắc ngay khi mở cổng Check-in (Trước 2 tiếng)</option>
            </select>
          </div>
        </div>

        {/* 3. BAO MAT & DOI MAT KHAU */}
        <div className={`p-5 rounded-2xl border space-y-4 ${cardSurface}`}>
          <h3 className="text-sm font-extrabold flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
            <Lock className="w-4 h-4 text-indigo-600" />
            3. Bảo mật & Cập nhật Mật khẩu
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold mb-1">Mật khẩu hiện tại</label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border ${inputSurface}`}
              />
            </div>
            <div>
              <label className="block font-bold mb-1">
                Mật khẩu mới (≥ 8 ký tự, Hoa, thường, số)
              </label>
              <input
                type="password"
                placeholder="Nhập mật khẩu mới..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border ${inputSurface}`}
              />
            </div>
          </div>
        </div>

        {/* 4. QUY TAC THOI GIAN CHECK-IN & CHINH SACH HE THONG */}
        <div className={`p-5 rounded-2xl border space-y-4 ${cardSurface}`}>
          <h3 className="text-sm font-extrabold flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
            <Sliders className="w-4 h-4 text-amber-500" />
            4. Quy tắc Khung giờ Check-in & Hạn mức ({isSysAdmin ? 'Quyền ADMIN sửa' : 'Chỉ xem'})
          </h3>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold mb-1">Mở Check-in sớm</label>
              <input
                type="number"
                disabled={!isSysAdmin}
                value={earlyCheckinHours}
                onChange={(e) => setEarlyCheckinHours(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border font-bold ${inputSurface}`}
              />
              <span className="text-[10px] text-slate-400">Giờ trước khi họp</span>
            </div>
            <div>
              <label className="block font-bold mb-1">Giữ chỗ tạm (Hold)</label>
              <input
                type="number"
                disabled={!isSysAdmin}
                value={holdMinutes}
                onChange={(e) => setHoldMinutes(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border font-bold ${inputSurface}`}
              />
              <span className="text-[10px] text-slate-400">Phút đếm ngược</span>
            </div>
            <div>
              <label className="block font-bold mb-1">Ân hạn trễ QR</label>
              <input
                type="number"
                disabled={!isSysAdmin}
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border font-bold ${inputSurface}`}
              />
              <span className="text-[10px] text-slate-400">Phút trước khi hủy</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};