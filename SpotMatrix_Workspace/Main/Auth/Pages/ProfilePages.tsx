import React, { useState, useRef } from 'react';
import {
  Camera,
  Image as ImageIcon,
  User,
  Mail,
  Building2,
  Award,
  Phone,
  Briefcase,
  CheckCircle2,
  Calendar,
  Clock,
  Save,
  Sparkles,
} from 'lucide-react';
import { BookingPayloadItem, UserRoleType } from '../../../Shared/Types/GlobalSystemTypes';

export interface UserProfileCustomization {
  fullName: string;
  userEmail: string;
  username: string;
  role: UserRoleType;
  departmentName: string;
  accountCode: string;
  trustScore: number;
  phoneNumber: string;
  jobTitle: string;
  bioText: string;
  avatarUrl: string | null;
  backgroundUrl: string | null;
}

interface ProfilePagesProps {
  profileData: UserProfileCustomization;
  userBookings: BookingPayloadItem[];
  isDark: boolean;
  onSaveProfileCustomization: (updated: UserProfileCustomization) => void;
}

const PRESET_BACKGROUNDS = [
  {
    id: 'bg-1',
    label: 'Indigo Matrix',
    css: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f766e 100%)',
  },
  {
    id: 'bg-2',
    label: 'Nordic Ocean',
    css: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #0d9488 100%)',
  },
  {
    id: 'bg-3',
    label: 'Sunset Slate',
    css: 'linear-gradient(135deg, #1e293b 0%, #4f46e5 50%, #d97706 100%)',
  },
];

export const ProfilePages: React.FC<ProfilePagesProps> = ({
  profileData,
  userBookings,
  isDark,
  onSaveProfileCustomization,
}) => {
  const [formState, setFormState] = useState<UserProfileCustomization>(profileData);
  const [selectedPresetGradient, setSelectedPresetGradient] = useState<string>(
    PRESET_BACKGROUNDS[0].css
  );
  const [savedBannerMessage, setSavedBannerMessage] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement | null>(null);

  // Xử lý tải ảnh Avatar từ máy tính lên
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const nextState = { ...formState, avatarUrl: reader.result };
        setFormState(nextState);
        onSaveProfileCustomization(nextState);
        setSavedBannerMessage('Đã cập nhật ảnh đại diện (Avatar) mới thành công!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Xử lý tải ảnh nền Background từ máy tính lên
  const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const nextState = { ...formState, backgroundUrl: reader.result };
        setFormState(nextState);
        onSaveProfileCustomization(nextState);
        setSavedBannerMessage('Đã cập nhật ảnh bìa (Background) mới thành công!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfileCustomization(formState);
    setSavedBannerMessage('Đã lưu toàn bộ thông tin hồ sơ cá nhân!');
    setTimeout(() => setSavedBannerMessage(null), 4000);
  };

  const cardSurface = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/90 text-slate-800 shadow-sm';

  const inputSurface = isDark
    ? 'bg-slate-950 border-slate-800 text-slate-100'
    : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white';

  const checkedInCount = userBookings.filter((b) => b.bookingStatus === 'CHECKED_IN').length;

  return (
    <div className="space-y-6">
      {/* KHUNG ANH BIA BACKGROUND & ANH DAI DIEN AVATAR */}
      <div className={`rounded-3xl border overflow-hidden ${cardSurface}`}>
        <div
          className="relative h-48 sm:h-60 w-full bg-cover bg-center transition-all"
          style={
            formState.backgroundUrl
              ? { backgroundImage: `url(${formState.backgroundUrl})` }
              : { background: selectedPresetGradient }
          }
        >
          <div className="absolute inset-0 bg-black/20" />

          {/* Input file an de chon anh tu may tinh */}
          <input
            ref={backgroundInputRef}
            type="file"
            accept="image/*"
            onChange={handleBackgroundFileChange}
            className="hidden"
          />
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarFileChange}
            className="hidden"
          />

          {/* Cum nut doi hinh nen Background o goc tren ben phai */}
          <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2">
            {PRESET_BACKGROUNDS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setSelectedPresetGradient(preset.css);
                  const nextState = { ...formState, backgroundUrl: null };
                  setFormState(nextState);
                  onSaveProfileCustomization(nextState);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-black/45 hover:bg-black/65 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 transition"
              >
                {preset.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => backgroundInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/95 hover:bg-white text-slate-900 text-xs font-extrabold shadow-lg transition"
            >
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              Tải ảnh nền từ máy
            </button>
          </div>
        </div>

        {/* Thong tin Avatar & Ten nam de len chan anh bia */}
        <div className="px-6 sm:px-8 pb-6 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="relative group">
              {formState.avatarUrl ? (
                <img
                  src={formState.avatarUrl}
                  alt={formState.fullName}
                  className="w-28 h-28 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-xl bg-slate-900"
                />
              ) : (
                <div className="w-28 h-28 rounded-3xl bg-indigo-600 text-white border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center font-black text-4xl">
                  {(formState.fullName || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-1.5 right-1.5 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg border-2 border-white dark:border-slate-900 transition"
                title="Tải ảnh đại diện (Avatar) mới"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-2 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">{formState.fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                  {formState.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                @{formState.username} • Mã định danh: <strong>{formState.accountCode}</strong> •{' '}
                {formState.jobTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-2 rounded-2xl border text-xs ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-teal-50/70 border-teal-200'
              }`}
            >
              <span className="text-slate-400 block text-[10px] font-bold uppercase">
                Điểm Tín nhiệm
              </span>
              <strong className="text-base font-black text-teal-600 dark:text-teal-400">
                {formState.trustScore} / 100đ
              </strong>
            </div>
          </div>
        </div>
      </div>

      {savedBannerMessage && (
        <div className="p-3.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedBannerMessage}</span>
        </div>
      )}

      {/* LUOI NOI DUNG: FORM CAP NHAT HO SO & LICH SU DAT PHONG CA NHAN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSaveFormSubmit}
          className={`lg:col-span-7 p-6 rounded-2xl border space-y-4 ${cardSurface}`}
        >
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                Thông tin Dữ liệu Hồ sơ Cá nhân
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chỉnh sửa thông tin hiển thị và đồng bộ trực tiếp với toàn hệ thống SpotMatrix
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">Họ và Tên hiển thị</label>
              <input
                type="text"
                required
                value={formState.fullName}
                onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${inputSurface}`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formState.userEmail}
                  onChange={(e) => setFormState({ ...formState, userEmail: e.target.value })}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs font-semibold ${inputSurface}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Phòng ban / Đơn vị</label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formState.departmentName}
                  onChange={(e) =>
                    setFormState({ ...formState, departmentName: e.target.value })
                  }
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs font-semibold ${inputSurface}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Chức danh công việc</label>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formState.jobTitle}
                  onChange={(e) => setFormState({ ...formState, jobTitle: e.target.value })}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs font-semibold ${inputSurface}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Số điện thoại liên hệ</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formState.phoneNumber}
                  onChange={(e) =>
                    setFormState({ ...formState, phoneNumber: e.target.value })
                  }
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs font-semibold ${inputSurface}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Vai trò Phân quyền</label>
              <input
                type="text"
                disabled
                value={`${formState.role} (Mã: ${formState.accountCode})`}
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Giới thiệu / Ghi chú lịch làm việc</label>
            <textarea
              rows={3}
              value={formState.bioText}
              onChange={(e) => setFormState({ ...formState, bioText: e.target.value })}
              className={`w-full p-3.5 rounded-xl border text-xs font-medium ${inputSurface}`}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Lưu Thay đổi Hồ sơ
            </button>
          </div>
        </form>

        {/* COT PHAI: THONG KE HOAT DONG CA NHAN & LICH SU DAT PHONG */}
        <div className={`lg:col-span-5 p-6 rounded-2xl border space-y-4 ${cardSurface}`}>
          <h2 className="text-base font-extrabold flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
            <Award className="w-4 h-4 text-teal-600" />
            Thống kê Hoạt động & Lịch sử Đặt phòng
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div
              className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <span className="text-slate-400 block">Tổng số lượt đặt phòng</span>
              <strong className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {userBookings.length} lượt
              </strong>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <span className="text-slate-400 block">Đã quét QR đúng hạn</span>
              <strong className="text-xl font-black text-teal-600 dark:text-teal-400">
                {checkedInCount} lần
              </strong>
            </div>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {userBookings.map((bk) => (
              <div
                key={bk.bookingId}
                className={`p-3.5 rounded-xl border text-xs ${
                  isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                    Phòng {bk.nodeId}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/15 text-teal-600">
                    {bk.bookingStatus}
                  </span>
                </div>
                <p className="font-semibold mt-1">{bk.purposeNote}</p>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {bk.startTimeIso} – {bk.endTimeIso}
                  {bk.checkedInAtIso && ` • Đã quét lúc: ${bk.checkedInAtIso}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};