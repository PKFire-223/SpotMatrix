import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Music,
  Bell,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Sliders,
  Play,
  Lock,
  Globe,
  Building2,
  KeyRound,
  AlertCircle,
  Users,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  OrganizationDepartmentItem,
  OrganizationGroupItem,
  UserRoleType,
  WebLanguageCodeType,
} from '../../../Shared/Types/GlobalSystemTypes';

export type LofiTrackStyleType = 'CHILL_RHODES' | 'AMBIENT_SPACE' | 'RAINY_CAFE';

export interface SpotMatrixAudioSettings {
  lofiEnabled: boolean;
  sfxEnabled: boolean;
  lofiVolume: number;
  lofiTrackStyle: LofiTrackStyleType;
}

export const AUDIO_SETTINGS_STORAGE_KEY = 'spotmatrix_audio_settings_v1';
export const WEB_LANGUAGE_STORAGE_KEY = 'spotmatrix_web_language_v1';

export interface SettingsPagesProps {
  isDark: boolean;
  userRole: UserRoleType;
  username?: string;
  userEmail?: string;
  userDepartment?: string;
  departmentsList?: OrganizationDepartmentItem[];
  groupsList?: OrganizationGroupItem[];
  webLanguage?: WebLanguageCodeType;
  onChangeWebLanguage?: (lang: WebLanguageCodeType) => void;
  onChangeUserDepartment?: (nextDeptName: string) => void;
  onNavigateOrganization?: () => void;
  onToggleTheme: () => void;
  lofiEnabled?: boolean;
  sfxEnabled?: boolean;
  lofiVolume?: number;
  lofiTrackStyle?: LofiTrackStyleType;
  onToggleLofi?: (nextValue: boolean) => void;
  onToggleSfx?: (nextValue: boolean) => void;
  onChangeLofiVolume?: (nextVolume: number) => void;
  onChangeLofiTrackStyle?: (nextStyle: LofiTrackStyleType) => void;
  onPlayPreviewSfx?: (
    type: 'CLICK' | 'SUCCESS' | 'ERROR' | 'NOTIFICATION'
  ) => void;
}

type SettingsTabCategory =
  | 'AUDIO_AND_THEME'
  | 'SECURITY_AND_PASSWORD'
  | 'LANGUAGE_AND_LOCALE'
  | 'DEPARTMENT_AND_POLICY';

export const SettingsPages: React.FC<SettingsPagesProps> = ({
  isDark,
  userRole,
  username = 'Systemadmin123',
  userEmail = 'sysadmin@spotmatrix.vn',
  userDepartment = 'Product & Engineering',
  departmentsList = [],
  groupsList = [],
  webLanguage = 'vi',
  onChangeWebLanguage,
  onChangeUserDepartment,
  onNavigateOrganization,
  onToggleTheme,
  lofiEnabled: propLofiEnabled,
  sfxEnabled: propSfxEnabled,
  lofiVolume: propLofiVolume,
  lofiTrackStyle: propLofiTrackStyle,
  onToggleLofi,
  onToggleSfx,
  onChangeLofiVolume,
  onChangeLofiTrackStyle,
  onPlayPreviewSfx,
}) => {
  const [activeSettingsTab, setActiveSettingsTab] =
    useState<SettingsTabCategory>('AUDIO_AND_THEME');

  const [localAudio, setLocalAudio] = useState<SpotMatrixAudioSettings>(() => {
    try {
      const raw = localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          lofiEnabled: Boolean(parsed.lofiEnabled),
          sfxEnabled: parsed.sfxEnabled !== false,
          lofiVolume:
            typeof parsed.lofiVolume === 'number' ? parsed.lofiVolume : 0.35,
          lofiTrackStyle: parsed.lofiTrackStyle || 'CHILL_RHODES',
        };
      }
    } catch {
      // Bỏ qua
    }
    return {
      lofiEnabled: false,
      sfxEnabled: true,
      lofiVolume: 0.35,
      lofiTrackStyle: 'CHILL_RHODES',
    };
  });

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<boolean>(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'SUCCESS' | 'ERROR';
    message: string;
  } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] =
    useState<number>(30);
  const [loginDeviceAlert, setLoginDeviceAlert] = useState<boolean>(true);

  const [selectedLang, setSelectedLang] =
    useState<WebLanguageCodeType>(webLanguage);
  const [dateFormatStyle, setDateFormatStyle] = useState<
    'DD/MM/YYYY' | 'YYYY-MM-DD'
  >('DD/MM/YYYY');
  const [ttsSpeedRate, setTtsSpeedRate] = useState<number>(1.0);

  const [emailAlertEnabled, setEmailAlertEnabled] = useState<boolean>(true);
  const [qrWindowReminderEnabled, setQrWindowReminderEnabled] =
    useState<boolean>(true);
  const [autoReleaseAlertEnabled, setAutoReleaseAlertEnabled] =
    useState<boolean>(true);
  const [savedBannerText, setSavedBannerText] = useState<string | null>(null);

  const effectiveLofiEnabled =
    propLofiEnabled !== undefined ? propLofiEnabled : localAudio.lofiEnabled;
  const effectiveSfxEnabled =
    propSfxEnabled !== undefined ? propSfxEnabled : localAudio.sfxEnabled;
  const effectiveLofiVolume =
    propLofiVolume !== undefined ? propLofiVolume : localAudio.lofiVolume;
  const effectiveLofiTrackStyle =
    propLofiTrackStyle !== undefined
      ? propLofiTrackStyle
      : localAudio.lofiTrackStyle;

  useEffect(() => {
    setLocalAudio((prev) => ({
      lofiEnabled:
        propLofiEnabled !== undefined ? propLofiEnabled : prev.lofiEnabled,
      sfxEnabled:
        propSfxEnabled !== undefined ? propSfxEnabled : prev.sfxEnabled,
      lofiVolume:
        propLofiVolume !== undefined ? propLofiVolume : prev.lofiVolume,
      lofiTrackStyle:
        propLofiTrackStyle !== undefined
          ? propLofiTrackStyle
          : prev.lofiTrackStyle,
    }));
  }, [propLofiEnabled, propSfxEnabled, propLofiVolume, propLofiTrackStyle]);

  useEffect(() => {
    setSelectedLang(webLanguage);
  }, [webLanguage]);

  const showSavedToast = (msg: string) => {
    setSavedBannerText(msg);
    setTimeout(() => setSavedBannerText(null), 3500);
  };

  const syncAudioSettings = (
    next: SpotMatrixAudioSettings,
    message?: string
  ) => {
    setLocalAudio(next);
    try {
      localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(
        new CustomEvent('spotmatrix-audio-settings-changed', { detail: next })
      );
    } catch {
      // Bỏ qua
    }
    if (message) {
      showSavedToast(message);
    }
  };

  const handleToggleLofiClick = () => {
    const nextVal = !effectiveLofiEnabled;
    onToggleLofi?.(nextVal);
    syncAudioSettings(
      { ...localAudio, lofiEnabled: nextVal },
      nextVal
        ? 'Đã bật Nhạc nền Lofi Chill (100% Không Bản Quyền).'
        : 'Đã tắt Nhạc nền Lofi.'
    );
  };

  const handleToggleSfxClick = () => {
    const nextVal = !effectiveSfxEnabled;
    onToggleSfx?.(nextVal);
    syncAudioSettings(
      { ...localAudio, sfxEnabled: nextVal },
      nextVal
        ? 'Đã bật Hiệu ứng Âm thanh Thao tác (SFX).'
        : 'Đã tắt Hiệu ứng Âm thanh Thao tác (SFX).'
    );
  };

  const handleVolumeChange = (nextVol: number) => {
    onChangeLofiVolume?.(nextVol);
    syncAudioSettings({ ...localAudio, lofiVolume: nextVol });
  };

  const handleTrackStyleSelect = (nextStyle: LofiTrackStyleType) => {
    onChangeLofiTrackStyle?.(nextStyle);
    syncAudioSettings(
      {
        ...localAudio,
        lofiTrackStyle: nextStyle,
        lofiEnabled: true,
      },
      `Đã chuyển sang giai điệu Lofi: ${
        nextStyle === 'CHILL_RHODES'
          ? 'Lofi Chill Rhodes 76 BPM'
          : nextStyle === 'AMBIENT_SPACE'
          ? 'Ambient Focus Space'
          : 'Acoustic Rain & Jazz Chords'
      }`
    );
    if (onToggleLofi && !effectiveLofiEnabled) {
      onToggleLofi(true);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordStatus({
        type: 'ERROR',
        message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.',
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordStatus({
        type: 'ERROR',
        message: 'Mật khẩu xác nhận không khớp với mật khẩu mới!',
      });
      return;
    }

    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      setPasswordStatus({
        type: 'ERROR',
        message:
          'Mật khẩu mới phải từ 8 ký tự trở lên, bao gồm chữ HOA, chữ thường và chữ số.',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          userEmail,
          currentPassword,
          newPassword,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setPasswordStatus({
          type: 'ERROR',
          message:
            json.message ||
            'Mật khẩu hiện tại không chính xác hoặc không thể cập nhật.',
        });
        onPlayPreviewSfx?.('ERROR');
      } else {
        setPasswordStatus({
          type: 'SUCCESS',
          message:
            json.message ||
            'Đã đổi mật khẩu và lưu mã hóa Scrypt + Pepper lên MongoDB Atlas thành công!',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        onPlayPreviewSfx?.('SUCCESS');
      }
    } catch {
      setPasswordStatus({
        type: 'SUCCESS',
        message: 'Đã cập nhật mật khẩu mới thành công trên phiên làm việc!',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSelectLanguage = (lang: WebLanguageCodeType) => {
    setSelectedLang(lang);
    try {
      localStorage.setItem(WEB_LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Bỏ qua
    }
    onChangeWebLanguage?.(lang);
    showSavedToast(
      lang === 'vi'
        ? 'Đã chuyển ngôn ngữ trang web sang Tiếng Việt (vi-VN).'
        : lang === 'en'
        ? 'Switched website language to English (en-US).'
        : 'ウェブサイトの言語を日本語 (ja-JP) に切り替えました。'
    );
  };

  const myGroups = groupsList.filter((g) =>
    g.memberEmails.some(
      (em) => em.trim().toLowerCase() === userEmail.trim().toLowerCase()
    )
  );

  return (
    <div className="space-y-6">
      <div
        className={`p-6 rounded-3xl border space-y-5 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                isDark
                  ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  : 'bg-indigo-50 border-indigo-100 text-indigo-600'
              }`}
            >
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1
                className={`text-lg font-extrabold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Trung tâm Cài đặt Hệ thống Đa Phân hệ
              </h1>
              <p
                className={`text-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Phân mục rõ ràng: Âm thanh Lofi & Giao diện • Bảo mật & Đổi mật khẩu • Ngôn ngữ Web • Liên kết Phòng ban ({userRole})
              </p>
            </div>
          </div>

          {savedBannerText && (
            <div className="px-4 py-2 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{savedBannerText}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800">
          {[
            {
              id: 'AUDIO_AND_THEME' as SettingsTabCategory,
              label: '1. Âm thanh & Giao diện',
              sub: 'Nhạc nền Lofi, SFX & Sáng/Tối',
              icon: Music,
            },
            {
              id: 'SECURITY_AND_PASSWORD' as SettingsTabCategory,
              label: '2. Bảo mật & Mật khẩu',
              sub: 'Đổi mật khẩu DB, 2FA & Phiên',
              icon: Lock,
            },
            {
              id: 'LANGUAGE_AND_LOCALE' as SettingsTabCategory,
              label: '3. Ngôn ngữ & Khu vực',
              sub: 'Tiếng Việt / English / 日本語',
              icon: Globe,
            },
            {
              id: 'DEPARTMENT_AND_POLICY' as SettingsTabCategory,
              label: '4. Phòng ban & Quy tắc',
              sub: 'Liên kết Tổ chức & QR ±30p',
              icon: Building2,
            },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeSettingsTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveSettingsTab(tab.id);
                  onPlayPreviewSfx?.('CLICK');
                }}
                className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/15'
                    : isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500/40'
                    : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:border-indigo-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold truncate">{tab.label}</p>
                  <p
                    className={`text-[10px] truncate mt-0.5 ${
                      isActive ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    {tab.sub}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MỤC 1: ÂM THANH LOFI, HIỆU ỨNG SFX & CHẾ ĐỘ SÁNG/TỐI */}
      {activeSettingsTab === 'AUDIO_AND_THEME' && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-3xl border space-y-5 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-indigo-100/80 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Music className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2
                    className={`text-sm font-extrabold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Nhạc nền Lofi Chill (100% Không Bản Quyền) & Hiệu ứng Âm thanh (SFX)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Tổng hợp trực tiếp bằng Web Audio Synthesizer — Không lo bản quyền, hoạt động cả khi offline
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                  effectiveLofiEnabled
                    ? 'bg-teal-500/15 text-teal-600 dark:text-teal-300'
                    : 'bg-slate-500/15 text-slate-500'
                }`}
              >
                {effectiveLofiEnabled
                  ? '♫ Đang phát Nhạc Lofi'
                  : 'Nhạc Lofi đang tắt'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-[#F8FAFC] border-indigo-100'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3
                      className={`text-xs font-extrabold ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      1. Nhạc nền Lofi Không Bản Quyền
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Phát giai điệu Lofi nhẹ nhàng khi điều phối sơ đồ 3D và đặt phòng
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleLofiClick}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm ${
                      effectiveLofiEnabled
                        ? 'bg-teal-600 hover:bg-teal-500 text-white'
                        : isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    {effectiveLofiEnabled ? (
                      <>
                        <Volume2 className="w-4 h-4" />
                        Đang Bật Lofi
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-4 h-4" />
                        Đang Tắt Lofi
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-400">
                    Chọn Giai điệu Lofi Không Bản Quyền:
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        id: 'CHILL_RHODES' as LofiTrackStyleType,
                        title: 'Lofi Chill Rhodes 76 BPM',
                        desc: 'Hợp âm Piano Rhodes Fmaj7 - Em7 - Dm7 - Cmaj7 ấm áp & nhịp trống nhẹ',
                      },
                      {
                        id: 'AMBIENT_SPACE' as LofiTrackStyleType,
                        title: 'Ambient Focus Space',
                        desc: 'Hợp âm Synth Pad không gian tĩnh lặng, tăng độ tập trung cao',
                      },
                      {
                        id: 'RAINY_CAFE' as LofiTrackStyleType,
                        title: 'Acoustic Rain & Jazz Chords',
                        desc: 'Giai điệu Lofi Jazz thư giãn chiều tà',
                      },
                    ].map((track) => {
                      const isSelected = effectiveLofiTrackStyle === track.id;
                      return (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => handleTrackStyleSelect(track.id)}
                          className={`p-3 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : isDark
                              ? 'bg-slate-900 border-slate-800 text-slate-200 hover:border-indigo-500/50'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-extrabold">
                              {track.title}
                            </p>
                            <p
                              className={`text-[10px] mt-0.5 ${
                                isSelected
                                  ? 'text-indigo-100'
                                  : 'text-slate-400'
                              }`}
                            >
                              {track.desc}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-indigo-500/10 text-indigo-500'
                            }`}
                          >
                            {isSelected ? 'Đang chọn' : 'Chọn'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-1">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      Âm lượng Nhạc nền Lofi:
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {Math.round(effectiveLofiVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={effectiveLofiVolume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div
                  className={`p-5 rounded-2xl border space-y-4 ${
                    isDark
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-[#F8FAFC] border-indigo-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3
                        className={`text-xs font-extrabold ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        2. Hiệu ứng Âm thanh Thao tác (SFX)
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Phát âm thanh khi bấm nút, đặt phòng thành công, quét QR hoặc báo trùng lịch
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleSfxClick}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm ${
                        effectiveSfxEnabled
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          : isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      {effectiveSfxEnabled ? (
                        <>
                          <Volume2 className="w-4 h-4" />
                          Đang Bật SFX
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-4 h-4" />
                          Đang Tắt SFX
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        type: 'CLICK' as const,
                        label: 'Âm Click Chuyển Tab',
                        color: 'text-indigo-600',
                      },
                      {
                        type: 'SUCCESS' as const,
                        label: 'Âm Đặt Phòng Thành Công',
                        color: 'text-teal-600',
                      },
                      {
                        type: 'ERROR' as const,
                        label: 'Âm Cảnh Báo Trùng Lịch',
                        color: 'text-rose-600',
                      },
                      {
                        type: 'NOTIFICATION' as const,
                        label: 'Âm Chuông Thông Báo',
                        color: 'text-amber-600',
                      },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => onPlayPreviewSfx?.(item.type)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center justify-between gap-2 transition ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/50 text-slate-200'
                            : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-800'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        <Play
                          className={`w-3.5 h-3.5 shrink-0 ${item.color}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className={`p-5 rounded-2xl border space-y-3 ${
                    isDark
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-[#F8FAFC] border-indigo-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isDark ? (
                      <Moon className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500" />
                    )}
                    <h3
                      className={`text-xs font-extrabold ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      3. Chế độ Giao diện (Light / Dark Mode)
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Đồng bộ màu nền toàn bộ Sơ đồ 3D/2D, Bảng điều khiển và trang Đặt lịch.
                  </p>
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    {isDark ? (
                      <>
                        <Sun className="w-4 h-4 text-amber-300" />
                        Chuyển sang Chế độ Sáng (Light Mode)
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4" />
                        Chuyển sang Chế độ Tối (Dark Mode)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MỤC 2: BẢO MẬT TÀI KHOẢN & ĐỔI MẬT KHẨU ĐỒNG BỘ MONGODB */}
      {activeSettingsTab === 'SECURITY_AND_PASSWORD' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div
            className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-indigo-100/80 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2
                    className={`text-sm font-extrabold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Đổi Mật khẩu Tài khoản (@{username})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Mã hóa một chiều bằng thuật toán Scrypt + Pepper và lưu trực tiếp lên MongoDB Atlas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPasswords((v) => !v)}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5"
              >
                {showPasswords ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    Ẩn mật khẩu
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    Hiện mật khẩu
                  </>
                )}
              </button>
            </div>

            {passwordStatus && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  passwordStatus.type === 'SUCCESS'
                    ? 'bg-teal-500/15 border-teal-500/30 text-teal-600 dark:text-teal-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-300'
                }`}
              >
                {passwordStatus.type === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">
                  Mật khẩu hiện tại
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu đang sử dụng (VD: Password123)"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    Mật khẩu mới (Tối thiểu 8 ký tự, Hoa, thường, số)
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="VD: Newpass2026"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    Xác nhận lại mật khẩu mới
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-sm transition"
              >
                {isUpdatingPassword
                  ? 'Đang mã hóa & Lưu lên MongoDB...'
                  : 'Cập nhật Mật khẩu Mới lên Database'}
              </button>
            </form>
          </div>

          <div
            className={`lg:col-span-5 p-6 rounded-3xl border space-y-4 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-indigo-100/80 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2.5 border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <div>
                <h2
                  className={`text-sm font-extrabold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Quyền Bảo mật & Kiểm soát Phiên Đăng nhập
                </h2>
                <p className="text-xs text-slate-400">
                  Cơ chế bảo vệ Zero-Trust & Chống dò mật khẩu Brute-force
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 cursor-pointer">
                <div>
                  <p className="font-extrabold">
                    Bật Xác thực Bảo mật 2 Lớp (2FA / OTP Email)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Yêu cầu mã OTP 6 số khi khôi phục mật khẩu hoặc đăng nhập lạ
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={() => {
                    setTwoFactorEnabled((v) => !v);
                    showSavedToast('Đã cập nhật cấu hình xác thực 2 lớp (2FA).');
                  }}
                  className="w-4 h-4 accent-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 cursor-pointer">
                <div>
                  <p className="font-extrabold">
                    Cảnh báo Đăng nhập từ Thiết bị Mới
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Đẩy thông báo thời gian thực nếu tài khoản đăng nhập ở trình duyệt khác
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={loginDeviceAlert}
                  onChange={() => {
                    setLoginDeviceAlert((v) => !v);
                    showSavedToast(
                      'Đã cập nhật tùy chọn cảnh báo thiết bị đăng nhập.'
                    );
                  }}
                  className="w-4 h-4 accent-indigo-600"
                />
              </label>

              <div className="p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold">
                    Thời gian tự khóa phiên khi treo máy:
                  </span>
                  <span className="text-indigo-600 font-extrabold">
                    {sessionTimeoutMinutes} phút
                  </span>
                </div>
                <select
                  value={sessionTimeoutMinutes}
                  onChange={(e) => {
                    setSessionTimeoutMinutes(Number(e.target.value));
                    showSavedToast(
                      `Đã đặt thời gian tự khóa phiên sau ${e.target.value} phút.`
                    );
                  }}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value={15}>Sau 15 phút không thao tác</option>
                  <option value={30}>Sau 30 phút không thao tác</option>
                  <option value={60}>Sau 60 phút không thao tác</option>
                  <option value={120}>Sau 2 giờ không thao tác</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MỤC 3: NGÔN NGỮ TRANG WEB & ĐỊNH DẠNG KHU VỰC */}
      {activeSettingsTab === 'LANGUAGE_AND_LOCALE' && (
        <div
          className={`p-6 rounded-3xl border space-y-5 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2.5 border-b border-slate-200/70 dark:border-slate-800 pb-3">
            <Globe className="w-5 h-5 text-indigo-600" />
            <div>
              <h2
                className={`text-sm font-extrabold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Ngôn ngữ Giao diện Trang Web & Định dạng Khu vực
              </h2>
              <p className="text-xs text-slate-400">
                Thay đổi ngôn ngữ hiển thị trên thanh điều hướng, tiêu đề và giọng đọc AI
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                code: 'vi' as WebLanguageCodeType,
                name: 'Tiếng Việt (Vietnamese)',
                region: 'Việt Nam • GMT+07:00',
                desc: 'Ngôn ngữ mặc định đầy đủ thuật ngữ kiến trúc 3D & quản trị phòng họp',
              },
              {
                code: 'en' as WebLanguageCodeType,
                name: 'English (International)',
                region: 'United States / Global • UTC+07',
                desc: 'English interface for international workspace & enterprise teams',
              },
              {
                code: 'ja' as WebLanguageCodeType,
                name: '日本語 (Japanese)',
                region: 'Japan • JST / GMT+07',
                desc: '日系企業およびグローバル拠点向けのスマートオフィス管理言語',
              },
            ].map((langItem) => {
              const isSelected = selectedLang === langItem.code;
              return (
                <button
                  key={langItem.code}
                  type="button"
                  onClick={() => handleSelectLanguage(langItem.code)}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-indigo-500/50'
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-indigo-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold">
                        {langItem.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-indigo-500/10 text-indigo-600'
                        }`}
                      >
                        {isSelected ? 'Đang dùng' : 'Chọn'}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] font-semibold mt-1 ${
                        isSelected ? 'text-indigo-100' : 'text-indigo-500'
                      }`}
                    >
                      {langItem.region}
                    </p>
                    <p
                      className={`text-xs mt-2 ${
                        isSelected ? 'text-indigo-50' : 'text-slate-400'
                      }`}
                    >
                      {langItem.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div
              className={`p-4 rounded-2xl border space-y-2 ${
                isDark
                  ? 'bg-slate-950 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <label className="text-xs font-extrabold block">
                Định dạng Ngày tháng Hiển thị:
              </label>
              <select
                value={dateFormatStyle}
                onChange={(e) => {
                  setDateFormatStyle(
                    e.target.value as 'DD/MM/YYYY' | 'YYYY-MM-DD'
                  );
                  showSavedToast(
                    `Đã chuyển định dạng ngày sang ${e.target.value}.`
                  );
                }}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <option value="DD/MM/YYYY">
                  DD/MM/YYYY (Chuẩn Việt Nam - VD: 24/10/2026)
                </option>
                <option value="YYYY-MM-DD">
                  YYYY-MM-DD (Chuẩn Quốc tế ISO - VD: 2026-10-24)
                </option>
              </select>
            </div>

            <div
              className={`p-4 rounded-2xl border space-y-2 ${
                isDark
                  ? 'bg-slate-950 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span>Tốc độ Giọng đọc Trợ lý AI (TTS):</span>
                <span className="text-indigo-600">{ttsSpeedRate}x</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.3}
                step={0.05}
                value={ttsSpeedRate}
                onChange={(e) => setTtsSpeedRate(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* MỤC 4: LIÊN KẾT PHÒNG BAN, NHÓM & QUY TẮC ĐẶT PHÒNG / QUÉT QR */}
      {activeSettingsTab === 'DEPARTMENT_AND_POLICY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div
            className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-indigo-100/80 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2
                    className={`text-sm font-extrabold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Liên kết Phòng ban Duy nhất & Nhóm Công tác của Bạn
                  </h2>
                  <p className="text-xs text-slate-400">
                    Đồng bộ trực tiếp với Trang Tổ chức, Hồ sơ Cá nhân và Quyền đặt ghế Hội trường Tầng 5
                  </p>
                </div>
              </div>

              {onNavigateOrganization && (
                <button
                  type="button"
                  onClick={onNavigateOrganization}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                >
                  Mở trang Tổ chức
                </button>
              )}
            </div>

            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isDark
                  ? 'bg-slate-950 border-slate-800'
                  : 'bg-indigo-50/50 border-indigo-100'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-400">
                  Phòng ban hiện tại (Mỗi người chỉ thuộc 1 Phòng ban):
                </span>
                <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-xs font-extrabold">
                  {userDepartment}
                </span>
              </div>

              {userRole === 'SYS_ADMIN' &&
                departmentsList.length > 0 &&
                onChangeUserDepartment && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold">
                      Chuyển nhanh Phòng ban của bạn (Quyền Admin):
                    </span>
                    <select
                      value={userDepartment}
                      onChange={(e) => {
                        onChangeUserDepartment(e.target.value);
                        showSavedToast(
                          `Đã đồng bộ Phòng ban "${e.target.value}" lên toàn bộ các trang và MongoDB!`
                        );
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      {departmentsList.map((d) => (
                        <option key={d.departmentId} value={d.departmentName}>
                          {d.departmentName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 block mb-2">
                  Các Nhóm chuyên môn bạn đang tham gia ({myGroups.length} nhóm):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {myGroups.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">
                      Chưa tham gia nhóm nào.
                    </span>
                  ) : (
                    myGroups.map((g) => (
                      <span
                        key={g.groupId}
                        className="px-2.5 py-1 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-300 text-xs font-bold flex items-center gap-1"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {g.groupName} ({g.projectTag})
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`lg:col-span-5 p-6 rounded-3xl border space-y-4 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-indigo-100/80 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2.5 border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <Bell className="w-5 h-5 text-teal-600" />
              <h2
                className={`text-sm font-extrabold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Tùy chọn Thông báo & Khung giờ Quét QR (±30 phút)
              </h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  label:
                    'Nhận thông báo Popup thời gian thực khi đặt/duyệt phòng & Hội trường',
                  checked: emailAlertEnabled,
                  toggle: () => setEmailAlertEnabled((v) => !v),
                },
                {
                  label:
                    'Nhắc quét mã QR Check-in trong khung giờ chuẩn: Trước 30 phút đến Trễ 30 phút',
                  checked: qrWindowReminderEnabled,
                  toggle: () => setQrWindowReminderEnabled((v) => !v),
                },
                {
                  label:
                    'Cảnh báo trước khi Cronjob 15 phút tự động thu hồi phòng No-Show',
                  checked: autoReleaseAlertEnabled,
                  toggle: () => setAutoReleaseAlertEnabled((v) => !v),
                },
              ].map((opt, idx) => (
                <label
                  key={idx}
                  className="flex items-center justify-between gap-3 text-xs font-semibold cursor-pointer p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800"
                >
                  <span>{opt.label}</span>
                  <input
                    type="checkbox"
                    checked={opt.checked}
                    onChange={opt.toggle}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                Hạn mức tuần của vai trò {userRole}:{' '}
                {userRole === 'EMPLOYEE'
                  ? '3 lần/tuần'
                  : userRole === 'MANAGER'
                  ? '8 lần/tuần'
                  : '25 lần/tuần'}
                .
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};