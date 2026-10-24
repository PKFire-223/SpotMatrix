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
} from 'lucide-react';
import { UserRoleType } from '../../../Shared/Types/GlobalSystemTypes';

export type LofiTrackStyleType = 'CHILL_RHODES' | 'AMBIENT_SPACE' | 'RAINY_CAFE';

export interface SpotMatrixAudioSettings {
  lofiEnabled: boolean;
  sfxEnabled: boolean;
  lofiVolume: number;
  lofiTrackStyle: LofiTrackStyleType;
}

export const AUDIO_SETTINGS_STORAGE_KEY = 'spotmatrix_audio_settings_v1';

export interface SettingsPagesProps {
  isDark: boolean;
  userRole: UserRoleType;
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

export const SettingsPages: React.FC<SettingsPagesProps> = ({
  isDark,
  userRole,
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
  const [localAudio, setLocalAudio] = useState<SpotMatrixAudioSettings>(() => {
    try {
      const raw = localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          lofiEnabled: Boolean(parsed.lofiEnabled),
          sfxEnabled: parsed.sfxEnabled !== false,
          lofiVolume: typeof parsed.lofiVolume === 'number' ? parsed.lofiVolume : 0.35,
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

  const [emailAlertEnabled, setEmailAlertEnabled] = useState<boolean>(true);
  const [qrEarlyReminderEnabled, setQrEarlyReminderEnabled] = useState<boolean>(true);
  const [autoReleaseAlertEnabled, setAutoReleaseAlertEnabled] = useState<boolean>(true);
  const [savedBannerText, setSavedBannerText] = useState<string | null>(null);

  const effectiveLofiEnabled =
    propLofiEnabled !== undefined ? propLofiEnabled : localAudio.lofiEnabled;
  const effectiveSfxEnabled =
    propSfxEnabled !== undefined ? propSfxEnabled : localAudio.sfxEnabled;
  const effectiveLofiVolume =
    propLofiVolume !== undefined ? propLofiVolume : localAudio.lofiVolume;
  const effectiveLofiTrackStyle =
    propLofiTrackStyle !== undefined ? propLofiTrackStyle : localAudio.lofiTrackStyle;

  useEffect(() => {
    setLocalAudio((prev) => ({
      lofiEnabled: propLofiEnabled !== undefined ? propLofiEnabled : prev.lofiEnabled,
      sfxEnabled: propSfxEnabled !== undefined ? propSfxEnabled : prev.sfxEnabled,
      lofiVolume: propLofiVolume !== undefined ? propLofiVolume : prev.lofiVolume,
      lofiTrackStyle:
        propLofiTrackStyle !== undefined ? propLofiTrackStyle : prev.lofiTrackStyle,
    }));
  }, [propLofiEnabled, propSfxEnabled, propLofiVolume, propLofiTrackStyle]);

  const syncAudioSettings = (next: SpotMatrixAudioSettings, message?: string) => {
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
      setSavedBannerText(message);
      setTimeout(() => setSavedBannerText(null), 3000);
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
      { ...localAudio, lofiTrackStyle: nextStyle, lofiEnabled: true },
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

  return (
    <div className="space-y-6">
      <div
        className={`p-6 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
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
            <h1 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Cài đặt Hệ thống, Nhạc nền Lofi & Hiệu ứng Âm thanh
            </h1>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tùy chỉnh nhạc nền Lofi không bản quyền, hiệu ứng âm thanh (SFX) và giao diện ({userRole})
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
              <h2 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
            {effectiveLofiEnabled ? '♫ Đang phát Nhạc Lofi' : 'Nhạc Lofi đang tắt'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#F8FAFC] border-indigo-100'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
                        <p className="text-xs font-extrabold">{track.title}</p>
                        <p
                          className={`text-[10px] mt-0.5 ${
                            isSelected ? 'text-indigo-100' : 'text-slate-400'
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

          <div
            className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#F8FAFC] border-indigo-100'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
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

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400">
                  Nghe thử từng loại Hiệu ứng Âm thanh (SFX Test):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'CLICK' as const, label: 'Âm Click Chuyển Tab', color: 'text-indigo-600' },
                    { type: 'SUCCESS' as const, label: 'Âm Đặt Phòng Thành Công', color: 'text-teal-600' },
                    { type: 'ERROR' as const, label: 'Âm Cảnh Báo Trùng Lịch', color: 'text-rose-600' },
                    { type: 'NOTIFICATION' as const, label: 'Âm Chuông Thông Báo', color: 'text-amber-600' },
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
                      <Play className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border text-[11px] flex items-center gap-2 ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-indigo-50/60 border-indigo-100 text-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Bạn cũng có thể bật/tắt nhanh Nhạc nền Lofi ngay trên thanh Header phía trên!
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className={`p-6 rounded-3xl border space-y-4 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isDark ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <h2 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Chế độ Giao diện (Light / Dark Mode)
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Chuyển đổi đồng bộ màu nền toàn bộ Sơ đồ 3D/2D, Bảng điều khiển và trang Đặt lịch.
          </p>
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition"
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

        <div
          className={`p-6 rounded-3xl border space-y-3.5 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-teal-600" />
            <h2 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Tùy chọn Thông báo & Nhắc lịch Check-in QR
            </h2>
          </div>

          {[
            {
              label: 'Nhận thông báo Popup thời gian thực khi đặt/duyệt phòng',
              checked: emailAlertEnabled,
              toggle: () => setEmailAlertEnabled((v) => !v),
            },
            {
              label: 'Nhắc quét mã QR Check-in sớm trước 2 tiếng',
              checked: qrEarlyReminderEnabled,
              toggle: () => setQrEarlyReminderEnabled((v) => !v),
            },
            {
              label: 'Cảnh báo trước khi Cronjob 15 phút tự động thu hồi phòng No-Show',
              checked: autoReleaseAlertEnabled,
              toggle: () => setAutoReleaseAlertEnabled((v) => !v),
            },
          ].map((opt, idx) => (
            <label
              key={idx}
              className="flex items-center justify-between gap-3 text-xs font-semibold cursor-pointer"
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

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Tất cả tùy chọn âm thanh Lofi, SFX và giao diện đều được lưu tự động.</span>
          </div>
        </div>
      </div>
    </div>
  );
};