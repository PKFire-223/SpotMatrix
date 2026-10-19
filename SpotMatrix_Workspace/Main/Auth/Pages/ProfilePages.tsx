import React, { useState, useRef } from 'react';
import {
  Camera,
  Image as ImageIcon,
  User,
  Mail,
  Building2,
  ShieldCheck,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  Save,
  Trash2,
  Sparkles,
  CloudUpload,
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
  isSyncingMongo?: boolean;
  onSaveProfileCustomization: (updated: UserProfileCustomization) => void;
}

const PRESET_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80',
];

const compressImageFileToDataUrl = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.84
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let targetW = img.width;
        let targetH = img.height;

        if (targetW > maxWidth || targetH > maxHeight) {
          const ratio = Math.min(maxWidth / targetW, maxHeight / targetH);
          targetW = Math.round(targetW * ratio);
          targetH = Math.round(targetH * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(String(reader.result));
      img.src = String(reader.result);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const ProfilePages: React.FC<ProfilePagesProps> = ({
  profileData,
  userBookings,
  isDark,
  isSyncingMongo = false,
  onSaveProfileCustomization,
}) => {
  const [formState, setFormState] = useState<UserProfileCustomization>(profileData);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setFormState(profileData);
  }, [profileData]);

  const handleUploadImageFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
    targetField: 'avatarUrl' | 'backgroundUrl'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const isAvatar = targetField === 'avatarUrl';
      const compressedDataUrl = await compressImageFileToDataUrl(
        file,
        isAvatar ? 420 : 1360,
        isAvatar ? 420 : 520,
        0.85
      );
      const updated = {
        ...formState,
        [targetField]: compressedDataUrl,
      };
      setFormState(updated);
      onSaveProfileCustomization(updated);
      setSaveBanner(
        isAvatar
          ? 'Đã tải lên ảnh đại diện (Avatar) và đồng bộ trực tiếp vào MongoDB theo tài khoản!'
          : 'Đã cập nhật hình nền bìa (Background) và đồng bộ trực tiếp vào MongoDB theo tài khoản!'
      );
    } catch {
      setSaveBanner('Không thể xử lý tệp hình ảnh. Vui lòng chọn ảnh PNG/JPG khác.');
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfileCustomization(formState);
    setSaveBanner(
      'Đã lưu hồ sơ cá nhân, ảnh Avatar và hình nền vào cơ sở dữ liệu MongoDB thành công!'
    );
  };

  const myBookings = userBookings.filter(
    (b) =>
      b.userEmail.toLowerCase() === formState.userEmail.toLowerCase() ||
      (b.requesterUsername &&
        b.requesterUsername.toLowerCase() === formState.username.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div
        className={`rounded-3xl border overflow-hidden transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="relative h-56 sm:h-64 w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-600 overflow-hidden">
          {formState.backgroundUrl && (
            <img
              src={formState.backgroundUrl}
              alt="Profile Cover Background"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/15 to-transparent" />

          <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2">
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUploadImageFile(e, 'backgroundUrl')}
            />
            <button
              type="button"
              onClick={() => bgInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur-md border border-white/20 flex items-center gap-2 shadow-lg transition"
            >
              <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
              Tải ảnh nền từ máy tính
            </button>

            {formState.backgroundUrl && (
              <button
                type="button"
                onClick={() => {
                  const updated = { ...formState, backgroundUrl: null };
                  setFormState(updated);
                  onSaveProfileCustomization(updated);
                }}
                className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold backdrop-blur-md transition"
                title="Xóa ảnh nền về mặc định"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="absolute bottom-3 right-4 hidden sm:flex items-center gap-1.5 bg-slate-900/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-semibold text-white mr-1">Mẫu nền nhanh:</span>
            {PRESET_BACKGROUNDS.map((bgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const updated = { ...formState, backgroundUrl: bgUrl };
                  setFormState(updated);
                  onSaveProfileCustomization(updated);
                  setSaveBanner('Đã đổi mẫu hình nền và lưu vào MongoDB!');
                }}
                className="w-6 h-6 rounded-lg overflow-hidden border border-white/40 hover:scale-110 transition"
              >
                <img src={bgUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-white dark:border-slate-900 shadow-xl bg-indigo-600 flex items-center justify-center overflow-hidden group shrink-0">
                {formState.avatarUrl ? (
                  <img
                    src={formState.avatarUrl}
                    alt={formState.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-black text-white select-none">
                    {(formState.fullName || 'U').charAt(0).toUpperCase()}
                  </span>
                )}

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUploadImageFile(e, 'avatarUrl')}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-950/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1"
                >
                  <Camera className="w-5 h-5 text-teal-300" />
                  <span>Đổi Avatar</span>
                </button>
              </div>

              <div className="pt-2 sm:pb-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formState.fullName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                    {formState.role}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center gap-1">
                    <CloudUpload className="w-3 h-3" />
                    {isSyncingMongo ? 'Đang lưu MongoDB...' : 'Đã đồng bộ MongoDB'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  @{formState.username} • Mã định danh: {formState.accountCode} •{' '}
                  {formState.departmentName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Tải ảnh Avatar lên
              </button>
              {formState.avatarUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...formState, avatarUrl: null };
                    setFormState(updated);
                    onSaveProfileCustomization(updated);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/50 text-rose-500 hover:bg-rose-500/10 transition"
                >
                  Xóa Avatar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {saveBanner && (
        <div className="p-4 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {saveBanner}
          </span>
          <button
            type="button"
            onClick={() => setSaveBanner(null)}
            className="text-[11px] underline"
          >
            Đóng
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSaveForm}
          className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
            <h2
              className={`text-sm font-bold flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-indigo-600" />
              Thông tin Dữ liệu Hồ sơ Cá nhân (Lưu trữ MongoDB)
            </h2>
            <span className="text-[11px] text-slate-400">
              Tự động đồng bộ khi đăng nhập ở máy khác
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-500">Họ và tên</label>
              <input
                type="text"
                value={formState.fullName}
                onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-500">
                Email công việc
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={formState.userEmail}
                  onChange={(e) => setFormState({ ...formState, userEmail: e.target.value })}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-500">
                Phòng ban / Bộ phận
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={formState.departmentName}
                  onChange={(e) => setFormState({ ...formState, departmentName: e.target.value })}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-500">
                Chức danh chuyên môn
              </label>
              <input
                type="text"
                value={formState.jobTitle}
                onChange={(e) => setFormState({ ...formState, jobTitle: e.target.value })}
                placeholder="VD: Tech Lead / Product Manager"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-500">
                Số điện thoại liên hệ
              </label>
              <input
                type="text"
                value={formState.phoneNumber}
                onChange={(e) => setFormState({ ...formState, phoneNumber: e.target.value })}
                placeholder="VD: 0908 123 456"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-500">
                Điểm tín nhiệm hiện tại
              </label>
              <div
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-between ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-teal-400'
                    : 'bg-teal-50/60 border-teal-200 text-teal-700'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  {formState.trustScore} / 100 điểm
                </span>
                <span className="text-[10px] uppercase">Hạng Uy Tín Cao</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-500">
              Giới thiệu ngắn & Ghi chú lịch họp ưu tiên
            </label>
            <textarea
              rows={3}
              value={formState.bioText}
              onChange={(e) => setFormState({ ...formState, bioText: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              Lưu Hồ sơ & Ảnh lên MongoDB
            </button>
          </div>
        </form>

        <div
          className={`lg:col-span-5 p-6 rounded-3xl border flex flex-col justify-between space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div>
            <h2
              className={`text-sm font-bold flex items-center gap-2 pb-3 mb-4 border-b border-slate-200/70 dark:border-slate-800 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-teal-600" />
              Lịch sử Đặt phòng của Tài khoản ({myBookings.length})
            </h2>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {myBookings.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">
                  Bạn chưa có lịch đặt phòng nào.
                </p>
              ) : (
                myBookings.map((item) => (
                  <div
                    key={item.bookingId}
                    className={`p-3.5 rounded-2xl border ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white">
                        {item.nodeId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.bookingStatus === 'CHECKED_IN'
                            ? 'bg-teal-500/15 text-teal-600'
                            : item.approvalStatus === 'PENDING_APPROVAL'
                            ? 'bg-amber-500/15 text-amber-600'
                            : 'bg-indigo-500/15 text-indigo-600'
                        }`}
                      >
                        {item.bookingStatus === 'CHECKED_IN'
                          ? 'ĐÃ CHECK-IN'
                          : item.approvalStatus === 'PENDING_APPROVAL'
                          ? 'CHỜ PHÊ DUYỆT'
                          : 'ĐÃ DUYỆT'}
                      </span>
                    </div>
                    <p
                      className={`text-xs font-bold mt-1.5 ${
                        isDark ? 'text-slate-100' : 'text-slate-800'
                      }`}
                    >
                      {item.purposeNote}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      {item.bookingDateIso} • {item.startTimeIso} – {item.endTimeIso}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-300'
                : 'bg-indigo-50/50 border-indigo-100 text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Ảnh Avatar và Hình nền được lưu trực tiếp theo tài khoản{' '}
              <strong>@{formState.username}</strong> trong MongoDB Atlas, mở trên máy tính khác vẫn
              hiển thị đầy đủ.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};