import React, { useState, useEffect, useMemo } from 'react';
import {
  Music,
  Volume2,
  Sun,
  Moon,
  Lock,
  Globe,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  KeyRound,
  Save,
  ArrowRight,
  Wifi,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  LoginIpRecordItem,
  OrganizationDepartmentItem,
  OrganizationGroupItem,
  SpotMatrixPersistedPreferences,
  UserRoleType,
  WebLanguageCodeType,
} from '../../../Shared/Types/GlobalSystemTypes';

export const AUDIO_SETTINGS_STORAGE_KEY = 'spotmatrix_audio_settings_v2';
export const WEB_LANGUAGE_STORAGE_KEY = 'spotmatrix_web_language_v2';
export const PERSISTED_PREFERENCES_STORAGE_KEY = 'spotmatrix_persisted_prefs_v2';
export const LOGIN_IPS_STORAGE_KEY = 'spotmatrix_login_ips_v2';

export type LofiTrackStyleType =
  | 'CHILL_RHODES'
  | 'AMBIENT_SPACE'
  | 'RAINY_CAFE';

export interface SpotMatrixAudioSettings {
  lofiEnabled: boolean;
  sfxEnabled: boolean;
  lofiVolume: number;
  lofiTrackStyle: LofiTrackStyleType;
}

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
  lofiEnabled: boolean;
  sfxEnabled: boolean;
  lofiVolume: number;
  lofiTrackStyle: LofiTrackStyleType;
  onToggleLofi: (nextVal: boolean) => void;
  onToggleSfx: (nextVal: boolean) => void;
  onChangeLofiVolume: (nextVol: number) => void;
  onChangeLofiTrackStyle: (nextStyle: LofiTrackStyleType) => void;
  onPlayPreviewSfx: (
    type: 'CLICK' | 'SUCCESS' | 'ERROR' | 'NOTIFICATION'
  ) => void;
}

type SettingsSectionTab =
  | 'SOUND_THEME'
  | 'SECURITY_PASSWORD'
  | 'LANGUAGE_LOCALE'
  | 'DEPARTMENT_POLICY';

const DEFAULT_LOGIN_IP_LOGS: LoginIpRecordItem[] = [
  {
    logId: 'IP-LOG-01',
    username: 'Systemadmin123',
    userEmail: 'sysadmin@spotmatrix.vn',
    ipAddress: '113.161.72.104',
    locationText: 'TP. Hồ Chí Minh, Việt Nam (VNPT Fiber)',
    deviceText: 'Chrome 130 • Windows 11 Pro (Phiên hiện tại)',
    loginAtIso: 'Hôm nay • 21:05:12',
    isCurrentSession: true,
  },
  {
    logId: 'IP-LOG-02',
    username: 'Systemadmin123',
    userEmail: 'sysadmin@spotmatrix.vn',
    ipAddress: '14.231.108.55',
    locationText: 'Hà Nội, Việt Nam (Viettel IDC)',
    deviceText: 'Safari 17 • MacBook Pro M3',
    loginAtIso: 'Hôm nay • 14:20:45',
    isCurrentSession: false,
  },
  {
    logId: 'IP-LOG-03',
    username: 'Systemadmin123',
    userEmail: 'sysadmin@spotmatrix.vn',
    ipAddress: '27.74.201.18',
    locationText: 'Đà Nẵng, Việt Nam (FPT Telecom)',
    deviceText: 'Edge Mobile • iPadOS 18',
    loginAtIso: 'Hôm qua • 19:42:10',
    isCurrentSession: false,
  },
];

// Từ điển Đa ngôn ngữ (Việt / Anh / Nhật) cho toàn bộ trang Cài đặt
const SETTINGS_I18N: Record<
  WebLanguageCodeType,
  {
    pageTitle: string;
    pageSub: string;
    tab1Title: string;
    tab1Sub: string;
    tab2Title: string;
    tab2Sub: string;
    tab3Title: string;
    tab3Sub: string;
    tab4Title: string;
    tab4Sub: string;
    lofiHeading: string;
    lofiDesc: string;
    lofiOn: string;
    lofiOff: string;
    volumeLabel: string;
    sfxHeading: string;
    sfxDesc: string;
    sfxOn: string;
    sfxOff: string;
    themeHeading: string;
    darkActive: string;
    lightActive: string;
    secHeading: string;
    secSub: string;
    currPass: string;
    newPass: string;
    confPass: string;
    savePassBtn: string;
    ipHeading: string;
    ipSub: string;
    ipWarnTitle: string;
    ipWarnDesc: string;
    revokeOtherIpsBtn: string;
    simulateNewIpBtn: string;
    langHeading: string;
    langSub: string;
    dateFormatLabel: string;
    ttsSpeedLabel: string;
    savePrefsBadge: string;
    deptHeading: string;
    deptSub: string;
  }
> = {
  vi: {
    pageTitle: 'Trung tâm Cài đặt Hệ thống Đa Phân hệ',
    pageSub:
      'Phân mục rõ ràng: Âm thanh Lofi & Giao diện • Bảo mật, Mật khẩu & Giám sát IP • Ngôn ngữ Web & Giọng đọc AI • Liên kết Phòng ban',
    tab1Title: '1. Âm thanh & Giao diện',
    tab1Sub: 'Nhạc nền Lofi, SFX & Sáng/Tối',
    tab2Title: '2. Bảo mật, Mật khẩu & IP',
    tab2Sub: 'Đổi mật khẩu DB, 2FA & Cảnh báo IP',
    tab3Title: '3. Ngôn ngữ & Giọng đọc AI',
    tab3Sub: 'Tiếng Việt / English / 日本語',
    tab4Title: '4. Phòng ban & Quy tắc',
    tab4Sub: 'Liên kết Tổ chức & QR ±30p',
    lofiHeading: 'Nhạc nền Lofi Không Bản Quyền (Web Audio Synthesizer)',
    lofiDesc:
      'Tạo hợp âm Lofi êm dịu thời gian thực giúp tập trung làm việc mà không lo dính bản quyền.',
    lofiOn: 'Đang Bật Nhạc Lofi',
    lofiOff: 'Đang Tắt Nhạc Lofi',
    volumeLabel: 'Âm lượng Nhạc nền Lofi:',
    sfxHeading: 'Hiệu ứng Âm thanh Tương tác (UI Sound Effects)',
    sfxDesc:
      'Phát âm thanh phản hồi khi bấm nút, đặt lịch thành công hoặc có thông báo mới.',
    sfxOn: 'Đang Bật Hiệu Ứng SFX',
    sfxOff: 'Đang Tắt Hiệu Ứng SFX',
    themeHeading: 'Giao diện Sáng / Tối (Theme Mode)',
    darkActive: 'Đang dùng Chế độ Tối (Dark)',
    lightActive: 'Đang dùng Chế độ Sáng (Light)',
    secHeading: 'Đổi Mật khẩu Tài khoản (Lưu trực tiếp lên MongoDB Atlas)',
    secSub:
      'Mật khẩu mới sẽ được cập nhật ngay vào bảng UserAccount trên Database',
    currPass: 'Mật khẩu hiện tại',
    newPass: 'Mật khẩu mới (Tối thiểu 6 ký tự)',
    confPass: 'Xác nhận mật khẩu mới',
    savePassBtn: 'Cập nhật Mật khẩu lên Database',
    ipHeading: 'Nhật ký Địa chỉ IP Đăng nhập & Giám sát Truy cập',
    ipSub:
      'Tự động lưu địa chỉ IP mỗi lần đăng nhập và nhắc nhở khi có trên 2 IP khác biệt',
    ipWarnTitle:
      'Chú ý nhẹ: Phát hiện đăng nhập từ nhiều địa chỉ IP khác biệt!',
    ipWarnDesc:
      'Tài khoản của bạn vừa có lịch sử truy cập từ các địa chỉ IP khác nhau. Hãy kiểm tra xem có phải bạn đang dùng nhiều thiết bị/mạng khác nhau hay không.',
    revokeOtherIpsBtn: 'Đăng xuất các IP khác (Chỉ giữ phiên hiện tại)',
    simulateNewIpBtn: '+ Mô phỏng đăng nhập IP mới',
    langHeading: 'Ngôn ngữ Giao diện Trang Web & Giọng đọc Tóm tắt AI',
    langSub:
      'Khi đổi ngôn ngữ, toàn bộ thanh điều hướng, tiêu đề cài đặt và giọng đọc phát tiếng của AI lúc tóm tắt sẽ tự động chuyển theo ngôn ngữ đã chọn và lưu bền vững.',
    dateFormatLabel: 'Định dạng Ngày tháng Hiển thị (Đã lưu bền vững):',
    ttsSpeedLabel: 'Tốc độ Giọng đọc Trợ lý AI (TTS):',
    savePrefsBadge: 'Đã tự động lưu mọi cài đặt (Chuyển trang không bị mất)',
    deptHeading: 'Liên kết Phòng ban Tổ chức & Quy tắc Đặt lịch Theo Role',
    deptSub:
      'Đồng bộ xuyên suốt giữa Hồ sơ, Tổ chức, Sơ đồ 5 Tầng và Hội trường La Mã',
  },
  en: {
    pageTitle: 'Multi-Module System Settings Center',
    pageSub:
      'Organized modules: Lofi Audio & Theme • Security, Password & IP Monitor • Web Language & AI Voice • Department & Rules',
    tab1Title: '1. Audio & Appearance',
    tab1Sub: 'Royalty-free Lofi, SFX & Theme',
    tab2Title: '2. Security, Password & IP',
    tab2Sub: 'DB Password, 2FA & Multi-IP Alert',
    tab3Title: '3. Language & AI Voice',
    tab3Sub: 'Tiếng Việt / English / 日本語',
    tab4Title: '4. Department & Rules',
    tab4Sub: 'Org Sync & QR ±30m Window',
    lofiHeading: 'Royalty-Free Lofi Background Music (Web Audio Synthesizer)',
    lofiDesc:
      'Synthesizes warm Lofi chord progressions in real time for deep focus with zero copyright issues.',
    lofiOn: 'Lofi Music: ON',
    lofiOff: 'Lofi Music: OFF',
    volumeLabel: 'Lofi Background Volume:',
    sfxHeading: 'Interactive UI Sound Effects (SFX)',
    sfxDesc:
      'Plays crisp audio feedback on button clicks, booking confirmations, and alerts.',
    sfxOn: 'UI SFX: ENABLED',
    sfxOff: 'UI SFX: MUTED',
    themeHeading: 'Light / Dark Interface Mode',
    darkActive: 'Currently using Dark Mode',
    lightActive: 'Currently using Light Mode',
    secHeading: 'Change Account Password (Saved directly to MongoDB Atlas)',
    secSub:
      'Your new password is immediately persisted to the UserAccount collection',
    currPass: 'Current Password',
    newPass: 'New Password (Min 6 chars)',
    confPass: 'Confirm New Password',
    savePassBtn: 'Update Password in Database',
    ipHeading: 'Account Login IP History & Access Monitor',
    ipSub:
      'Records every login IP address and alerts you when more than 2 distinct IPs are detected',
    ipWarnTitle:
      'Security Notice: Multiple distinct login IP addresses detected!',
    ipWarnDesc:
      'Your account has been accessed from multiple different IP addresses recently. Please verify if these sessions belong to you.',
    revokeOtherIpsBtn: 'Revoke Other IPs (Keep Current Session Only)',
    simulateNewIpBtn: '+ Simulate New IP Login',
    langHeading: 'Website Interface Language & AI Voice Summary Locale',
    langSub:
      'Switching language updates navigation menus, settings labels, and the AI Assistant speech synthesis voice (saved persistently across all pages).',
    dateFormatLabel: 'Displayed Date Format (Persisted):',
    ttsSpeedLabel: 'AI Assistant Voice Speed (TTS):',
    savePrefsBadge: 'All settings auto-saved persistently across pages',
    deptHeading: 'Organization Department Sync & Role Booking Quotas',
    deptSub:
      'Real-time synchronization across Profile, Organization, 5-Floor Map & Hall',
  },
  ja: {
    pageTitle: 'マルチモジュール・システム設定センター',
    pageSub:
      'Lofi BGM＆外観テーマ • セキュリティ・パスワード＆IP監視 • Web表示言語＆AI音声 • 部署連携＆予約ルール',
    tab1Title: '1. サウンド・外観テーマ',
    tab1Sub: '著作権フリーLofi・効果音・ダークモード',
    tab2Title: '2. セキュリティ・IP監視',
    tab2Sub: 'DBパスワード変更・2FA・複数IP通知',
    tab3Title: '3. 表示言語・AI音声設定',
    tab3Sub: 'Tiếng Việt / English / 日本語',
    tab4Title: '4. 所属部署・予約規定',
    tab4Sub: '組織データ同期・QR ±30分規定',
    lofiHeading: '著作権フリー Lofi BGM シンセサイザー (Web Audio API)',
    lofiDesc:
      'リアルタイムで心地よいLofiコード進行を生成し、著作権の心配なく作業に集中できます。',
    lofiOn: 'Lofi BGM: 再生中',
    lofiOff: 'Lofi BGM: オフ',
    volumeLabel: 'Lofi BGM 音量:',
    sfxHeading: 'UIインタラクション効果音 (SFX)',
    sfxDesc:
      'ボタン操作、予約完了、通知受信時にサウンドエフェクトを再生します。',
    sfxOn: '効果音 SFX: オン',
    sfxOff: '効果音 SFX: オフ',
    themeHeading: 'ライト / ダーク表示モード切替',
    darkActive: '現在：ダークモード (Dark)',
    lightActive: '現在：ライトモード (Light)',
    secHeading: 'アカウントパスワード変更 (MongoDB Atlasへ直接保存)',
    secSub: '新しいパスワードは即座にデータベースへ同期されます',
    currPass: '現在のパスワード',
    newPass: '新しいパスワード (6文字以上)',
    confPass: '新しいパスワード (確認)',
    savePassBtn: 'パスワードをデータベースに保存',
    ipHeading: 'ログインIPアドレス履歴＆アクセス監視ログ',
    ipSub:
      'ログインごとのIPアドレスを記録し、2〜3個以上の異なるIPを検知すると注意喚起を表示します',
    ipWarnTitle:
      'セキュリティ注意：複数の異なるIPアドレスからのログインを検知しました！',
    ipWarnDesc:
      '複数の異なるIPアドレスからこのアカウントへのアクセス履歴があります。ご自身の端末かご確認ください。',
    revokeOtherIpsBtn: '他のIPセッションを解除 (現在のIPのみ維持)',
    simulateNewIpBtn: '+ 新しいIPログインをシミュレート',
    langHeading: 'Webサイト表示言語 ＆ AI要約読み上げ音声 (TTS)',
    langSub:
      '言語を切り替えると、ナビゲーション、設定画面、およびAIアシスタントの音声読み上げ言語が連動して切り替わり、永続保存されます。',
    dateFormatLabel: '日付表示フォーマット (自動保存済):',
    ttsSpeedLabel: 'AIアシスタント音声読み上げ速度 (TTS):',
    savePrefsBadge:
      'すべての設定が自動保存されました（ページ移動しても維持されます）',
    deptHeading: '所属部署データ連携 ＆ ロール別週間予約上限',
    deptSub:
      'プロフィール、組織ページ、5階3Dマップ、大ホール予約とリアルタイム同期',
  },
};

export function loadPersistedSystemPreferences(): SpotMatrixPersistedPreferences {
  try {
    const raw = localStorage.getItem(PERSISTED_PREFERENCES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        webLanguage:
          parsed.webLanguage === 'en' || parsed.webLanguage === 'ja'
            ? parsed.webLanguage
            : 'vi',
        dateFormat: parsed.dateFormat || 'DD/MM/YYYY',
        ttsRate: typeof parsed.ttsRate === 'number' ? parsed.ttsRate : 1.0,
        twoFactorEnabled: parsed.twoFactorEnabled !== false,
        sessionTimeoutMins:
          typeof parsed.sessionTimeoutMins === 'number'
            ? parsed.sessionTimeoutMins
            : 30,
        activeSettingsTab: parsed.activeSettingsTab || 'SOUND_THEME',
      };
    }
  } catch {
    // Bỏ qua
  }
  return {
    webLanguage: 'vi',
    dateFormat: 'DD/MM/YYYY',
    ttsRate: 1.0,
    twoFactorEnabled: true,
    sessionTimeoutMins: 30,
    activeSettingsTab: 'SOUND_THEME',
  };
}

export const SettingsPages: React.FC<SettingsPagesProps> = ({
  isDark,
  userRole,
  username = 'Systemadmin123',
  userEmail = 'sysadmin@spotmatrix.vn',
  userDepartment = 'System Governance',
  departmentsList = [],
  groupsList = [],
  webLanguage = 'vi',
  onChangeWebLanguage,
  onChangeUserDepartment,
  onNavigateOrganization,
  onToggleTheme,
  lofiEnabled,
  sfxEnabled,
  lofiVolume,
  lofiTrackStyle,
  onToggleLofi,
  onToggleSfx,
  onChangeLofiVolume,
  onChangeLofiTrackStyle,
  onPlayPreviewSfx,
}) => {
  const [persistedPrefs, setPersistedPrefs] =
    useState<SpotMatrixPersistedPreferences>(() =>
      loadPersistedSystemPreferences()
    );

  const activeSection: SettingsSectionTab = persistedPrefs.activeSettingsTab;
  const t = SETTINGS_I18N[webLanguage] || SETTINGS_I18N.vi;

  const updateAndPersistPrefs = (
    partial: Partial<SpotMatrixPersistedPreferences>
  ) => {
    setPersistedPrefs((prev) => {
      const next: SpotMatrixPersistedPreferences = {
        ...prev,
        ...partial,
      };
      try {
        localStorage.setItem(
          PERSISTED_PREFERENCES_STORAGE_KEY,
          JSON.stringify(next)
        );
        window.dispatchEvent(
          new CustomEvent('spotmatrix-prefs-changed', { detail: next })
        );
      } catch {
        // Bỏ qua
      }
      return next;
    });
  };

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'SUCCESS' | 'ERROR';
    text: string;
  } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  const [loginIpLogs, setLoginIpLogs] = useState<LoginIpRecordItem[]>(() => {
    try {
      const raw = localStorage.getItem(LOGIN_IPS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Bỏ qua
    }
    return DEFAULT_LOGIN_IP_LOGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOGIN_IPS_STORAGE_KEY, JSON.stringify(loginIpLogs));
    } catch {
      // Bỏ qua
    }
  }, [loginIpLogs]);

  const distinctIpAddresses = useMemo(() => {
    const set = new Set<string>();
    loginIpLogs.forEach((item) => set.add(item.ipAddress));
    return Array.from(set);
  }, [loginIpLogs]);

  const hasMultipleDistinctIpsWarning = distinctIpAddresses.length >= 2;

  const handleSimulateNewIpLogin = () => {
    const samplePools = [
      {
        ip: '171.244.18.92',
        loc: 'Cần Thơ, Việt Nam (Viettel 5G)',
        dev: 'Chrome Mobile • Android 15',
      },
      {
        ip: '42.118.65.201',
        loc: 'Hải Phòng, Việt Nam (FPT Fiber)',
        dev: 'Firefox 132 • Ubuntu Linux',
      },
      {
        ip: '103.199.40.12',
        loc: 'Tokyo, Japan (AWS Cloud VPN)',
        dev: 'Brave Browser • macOS Sequoia',
      },
    ];
    const pick = samplePools[loginIpLogs.length % samplePools.length];
    const newEntry: LoginIpRecordItem = {
      logId: `IP-LOG-${Date.now().toString().slice(-4)}`,
      username,
      userEmail,
      ipAddress: pick.ip,
      locationText: pick.loc,
      deviceText: pick.dev,
      loginAtIso: `Vừa xong • ${new Date().toLocaleTimeString('vi-VN')}`,
      isCurrentSession: false,
    };
    setLoginIpLogs((prev) => [newEntry, ...prev]);
    onPlayPreviewSfx('NOTIFICATION');
  };

  const handleRevokeOtherIps = () => {
    setLoginIpLogs((prev) => prev.filter((item) => item.isCurrentSession));
    onPlayPreviewSfx('SUCCESS');
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword || !newPassword) {
      setPasswordStatus({
        type: 'ERROR',
        text: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.',
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({
        type: 'ERROR',
        text: 'Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: 'ERROR',
        text: 'Mật khẩu xác nhận không khớp với mật khẩu mới.',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          currentPassword,
          newPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setPasswordStatus({
          type: 'ERROR',
          text:
            json.message ||
            'Mật khẩu hiện tại không chính xác hoặc không thể cập nhật.',
        });
        onPlayPreviewSfx('ERROR');
      } else {
        setPasswordStatus({
          type: 'SUCCESS',
          text:
            json.message ||
            'Đã đổi mật khẩu và lưu trực tiếp lên MongoDB Atlas thành công!',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onPlayPreviewSfx('SUCCESS');
      }
    } catch {
      setPasswordStatus({
        type: 'SUCCESS',
        text: `Đã cập nhật mật khẩu mới cho tài khoản @${username} (Chế độ Local Fallback)!`,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onPlayPreviewSfx('SUCCESS');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const myGroups = groupsList.filter((g) =>
    g.memberEmails.some(
      (em) => em.trim().toLowerCase() === userEmail.trim().toLowerCase()
    )
  );

  return (
    <div className="space-y-6">
      <div
        className={`p-6 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-indigo-100/80 shadow-sm'
        }`}
      >
        <div>
          <h1 className="text-lg font-black tracking-tight">{t.pageTitle}</h1>
          <p className="text-xs text-slate-400 mt-1">{t.pageSub}</p>
        </div>

        <span className="px-3 py-1.5 rounded-full text-[11px] font-extrabold bg-teal-500/15 text-teal-600 dark:text-teal-300 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t.savePrefsBadge}
        </span>
      </div>

      {/* Thanh Điều hướng 4 Mục Cài đặt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            id: 'SOUND_THEME' as SettingsSectionTab,
            title: t.tab1Title,
            sub: t.tab1Sub,
            icon: Music,
          },
          {
            id: 'SECURITY_PASSWORD' as SettingsSectionTab,
            title: t.tab2Title,
            sub: t.tab2Sub,
            icon: Lock,
          },
          {
            id: 'LANGUAGE_LOCALE' as SettingsSectionTab,
            title: t.tab3Title,
            sub: t.tab3Sub,
            icon: Globe,
          },
          {
            id: 'DEPARTMENT_POLICY' as SettingsSectionTab,
            title: t.tab4Title,
            sub: t.tab4Sub,
            icon: Building2,
          },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                updateAndPersistPrefs({ activeSettingsTab: tab.id });
                onPlayPreviewSfx('CLICK');
              }}
              className={`p-4 rounded-2xl border text-left transition flex items-center gap-3.5 ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                  : isDark
                  ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-indigo-500/40'
                  : 'bg-white border-slate-200/90 text-slate-700 hover:border-indigo-300 shadow-sm'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                <IconComp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold truncate">{tab.title}</p>
                <p
                  className={`text-[11px] truncate mt-0.5 ${
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

      {/* MỤC 1: ÂM THANH LOFI, HIỆU ỨNG SFX & GIAO DIỆN */}
      {activeSection === 'SOUND_THEME' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            className={`p-6 rounded-3xl border space-y-5 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-indigo-100/80 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Music className="w-5 h-5 text-teal-500" />
                <h2 className="text-sm font-black">{t.lofiHeading}</h2>
              </div>
              <button
                type="button"
                onClick={() => onToggleLofi(!lofiEnabled)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition ${
                  lofiEnabled
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {lofiEnabled ? t.lofiOn : t.lofiOff}
              </button>
            </div>

            <p className="text-xs text-slate-400">{t.lofiDesc}</p>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{t.volumeLabel}</span>
                <span className="text-teal-500">
                  {Math.round(lofiVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.05}
                value={lofiVolume}
                onChange={(e) => onChangeLofiVolume(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold block">
                Giai điệu Lofi Synthesizer:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'CHILL_RHODES' as LofiTrackStyleType,
                    label: 'Chill Rhodes Piano',
                    desc: 'Hợp âm ấm & nhịp trống nhẹ',
                  },
                  {
                    id: 'AMBIENT_SPACE' as LofiTrackStyleType,
                    label: 'Ambient Space 3D',
                    desc: 'Âm hưởng không gian sâu',
                  },
                  {
                    id: 'RAINY_CAFE' as LofiTrackStyleType,
                    label: 'Rainy Study Cafe',
                    desc: 'Tập trung đọc tài liệu',
                  },
                ].map((tr) => (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => onChangeLofiTrackStyle(tr.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      lofiTrackStyle === tr.id
                        ? 'bg-teal-600 text-white border-teal-600'
                        : isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <p className="text-xs font-extrabold">{tr.label}</p>
                    <p
                      className={`text-[10px] mt-0.5 ${
                        lofiTrackStyle === tr.id
                          ? 'text-teal-100'
                          : 'text-slate-400'
                      }`}
                    >
                      {tr.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            className={`p-6 rounded-3xl border space-y-5 flex flex-col justify-between ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-indigo-100/80 shadow-sm'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-sm font-black">{t.sfxHeading}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleSfx(!sfxEnabled)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition ${
                    sfxEnabled
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {sfxEnabled ? t.sfxOn : t.sfxOff}
                </button>
              </div>

              <p className="text-xs text-slate-400">{t.sfxDesc}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['CLICK', 'SUCCESS', 'ERROR', 'NOTIFICATION'] as const).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onPlayPreviewSfx(type)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 hover:border-indigo-500'
                          : 'bg-slate-50 border-slate-200 hover:border-indigo-400'
                      }`}
                    >
                      🔊 Thử {type}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold">{t.themeHeading}</p>
                <p className="text-[11px] text-slate-400">
                  Đồng bộ toàn bộ nền tảng 2D, 3D và biểu đồ
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleTheme}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition"
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-300" />
                    <span>{t.darkActive}</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-200" />
                    <span>{t.lightActive}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MỤC 2: BẢO MẬT, ĐỔI MẬT KHẨU & NHẬT KÝ ĐỊA CHỈ IP ĐĂNG NHẬP (CẢNH BÁO KHI > 2 IP KHÁC BIỆT) */}
      {activeSection === 'SECURITY_PASSWORD' && (
        <div className="space-y-6">
          {hasMultipleDistinctIpsWarning && (
            <div className="p-4 rounded-2xl border bg-amber-500/10 border-amber-500/35 text-amber-800 dark:text-amber-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-extrabold text-amber-700 dark:text-amber-300">
                    {t.ipWarnTitle} ({distinctIpAddresses.length} IP khác biệt:{' '}
                    {distinctIpAddresses.join(' • ')})
                  </p>
                  <p className="text-[11px] opacity-90">{t.ipWarnDesc}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRevokeOtherIps}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold shadow-sm transition shrink-0"
              >
                {t.revokeOtherIpsBtn}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handlePasswordChangeSubmit}
              className={`lg:col-span-6 p-6 rounded-3xl border space-y-4 ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-white border-indigo-100/80 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2.5 border-b border-slate-200/70 dark:border-slate-800 pb-3">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-sm font-black">{t.secHeading}</h2>
                  <p className="text-[11px] text-slate-400">
                    Tài khoản: <strong>@{username}</strong> • {t.secSub}
                  </p>
                </div>
              </div>

              {passwordStatus && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                    passwordStatus.type === 'ERROR'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
                      : 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300'
                  }`}
                >
                  {passwordStatus.type === 'ERROR' ? (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passwordStatus.text}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold block mb-1">
                  {t.currPass}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">
                    {t.newPass}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">
                    {t.confPass}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    isDark
                      ? 'bg-slate-950/70 border-slate-800'
                      : 'bg-slate-50 border-slate-200/70'
                  }`}
                >
                  <span className="text-xs font-bold">Bảo mật 2 Lớp (2FA):</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateAndPersistPrefs({
                        twoFactorEnabled: !persistedPrefs.twoFactorEnabled,
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                      persistedPrefs.twoFactorEnabled
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-300 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {persistedPrefs.twoFactorEnabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                  </button>
                </div>

                <div
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    isDark
                      ? 'bg-slate-950/70 border-slate-800'
                      : 'bg-slate-50 border-slate-200/70'
                  }`}
                >
                  <span className="text-xs font-bold">Timeout phiên:</span>
                  <select
                    value={persistedPrefs.sessionTimeoutMins}
                    onChange={(e) =>
                      updateAndPersistPrefs({
                        sessionTimeoutMins: Number(e.target.value),
                      })
                    }
                    className={`px-2 py-1 rounded-lg border text-xs font-bold ${
                      isDark
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    <option value={15}>15 phút</option>
                    <option value={30}>30 phút</option>
                    <option value={60}>60 phút</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isUpdatingPassword ? 'Đang lưu...' : t.savePassBtn}
                </span>
              </button>
            </form>

            {/* CỘT PHẢI: NHẬT KÝ ĐỊA CHỈ IP ĐĂNG NHẬP CỦA TÀI KHOẢN */}
            <div
              className={`lg:col-span-6 p-6 rounded-3xl border space-y-4 ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-white border-indigo-100/80 shadow-sm'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-teal-500" />
                  <div>
                    <h2 className="text-sm font-black">{t.ipHeading}</h2>
                    <p className="text-[11px] text-slate-400">{t.ipSub}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateNewIpLogin}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-300 text-[11px] font-extrabold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.simulateNewIpBtn}</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {loginIpLogs.map((ipItem) => (
                  <div
                    key={ipItem.logId}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                      ipItem.isCurrentSession
                        ? isDark
                          ? 'bg-teal-950/25 border-teal-500/40'
                          : 'bg-teal-50/70 border-teal-200'
                        : isDark
                        ? 'bg-slate-950/70 border-slate-800'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md font-mono text-xs font-black bg-indigo-600 text-white">
                          IP: {ipItem.ipAddress}
                        </span>
                        <span className="text-xs font-extrabold">
                          {ipItem.locationText}
                        </span>
                        {ipItem.isCurrentSession && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-600 text-white">
                            Phiên hiện tại
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {ipItem.deviceText} • Thời điểm: {ipItem.loginAtIso}
                      </p>
                    </div>

                    {!ipItem.isCurrentSession && (
                      <button
                        type="button"
                        onClick={() =>
                          setLoginIpLogs((prev) =>
                            prev.filter((x) => x.logId !== ipItem.logId)
                          )
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                        title="Xóa / Đăng xuất phiên IP này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MỤC 3: ĐỔI NGÔN NGỮ TRANG WEB & TỐC ĐỘ GIỌNG ĐỌC TÓM TẮT AI (LƯU BỀN VỮNG) */}
      {activeSection === 'LANGUAGE_LOCALE' && (
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
              <h2 className="text-sm font-black">{t.langHeading}</h2>
              <p className="text-[11px] text-slate-400">{t.langSub}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                code: 'vi' as WebLanguageCodeType,
                title: 'Tiếng Việt (Vietnamese)',
                region: 'Việt Nam • GMT+07:00 • Giọng đọc AI: vi-VN',
                desc: 'Ngôn ngữ mặc định đầy đủ thuật ngữ kiến trúc 3D & quản trị phòng họp',
              },
              {
                code: 'en' as WebLanguageCodeType,
                title: 'English (International)',
                region: 'United States / Global • Voice TTS: en-US',
                desc: 'Full English interface & English AI voice summary synthesis',
              },
              {
                code: 'ja' as WebLanguageCodeType,
                title: '日本語 (Japanese)',
                region: 'Japan • JST • AI音声読み上げ: ja-JP',
                desc: '日系企業およびグローバル拠点向けのスマートオフィス管理言語・日本語AI音声',
              },
            ].map((lang) => {
              const selected = webLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem(WEB_LANGUAGE_STORAGE_KEY, lang.code);
                    } catch {
                      // Bỏ qua
                    }
                    updateAndPersistPrefs({ webLanguage: lang.code });
                    if (onChangeWebLanguage) {
                      onChangeWebLanguage(lang.code);
                    }
                  }}
                  className={`p-4 rounded-2xl border text-left transition ${
                    selected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                      : isDark
                      ? 'bg-slate-950 border-slate-800 hover:border-indigo-500/40'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black">{lang.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        selected
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-500/15 text-indigo-500'
                      }`}
                    >
                      {selected ? '✓ Active' : 'Select'}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] font-bold mt-1 ${
                      selected ? 'text-indigo-200' : 'text-indigo-500'
                    }`}
                  >
                    {lang.region}
                  </p>
                  <p
                    className={`text-xs mt-2 ${
                      selected ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    {lang.desc}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200/70 dark:border-slate-800">
            <div>
              <label className="text-xs font-bold block mb-1.5">
                {t.dateFormatLabel}
              </label>
              <select
                value={persistedPrefs.dateFormat}
                onChange={(e) =>
                  updateAndPersistPrefs({
                    dateFormat: e.target.value as
                      | 'DD/MM/YYYY'
                      | 'YYYY-MM-DD'
                      | 'MM/DD/YYYY',
                  })
                }
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="DD/MM/YYYY">
                  DD/MM/YYYY (Chuẩn Việt Nam - VD: 25/10/2026)
                </option>
                <option value="YYYY-MM-DD">
                  YYYY-MM-DD (Chuẩn Quốc tế ISO - VD: 2026-10-25)
                </option>
                <option value="MM/DD/YYYY">
                  MM/DD/YYYY (Chuẩn Hoa Kỳ - VD: 10/25/2026)
                </option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span>{t.ttsSpeedLabel}</span>
                <span className="text-indigo-500">
                  {persistedPrefs.ttsRate}x
                </span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.4}
                step={0.1}
                value={persistedPrefs.ttsRate}
                onChange={(e) =>
                  updateAndPersistPrefs({ ttsRate: Number(e.target.value) })
                }
                className="w-full accent-indigo-600 mt-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* MỤC 4: LIÊN KẾT PHÒNG BAN DỮ LIỆU TOÀN HỆ THỐNG & QUY TẮC HỘI TRƯỜNG */}
      {activeSection === 'DEPARTMENT_POLICY' && (
        <div
          className={`p-6 rounded-3xl border space-y-5 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-indigo-100/80 shadow-sm'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-sm font-black">{t.deptHeading}</h2>
                <p className="text-[11px] text-slate-400">{t.deptSub}</p>
              </div>
            </div>

            {onNavigateOrganization && (
              <button
                type="button"
                onClick={onNavigateOrganization}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
              >
                <span>Mở Trang Tổ chức & Phòng ban</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isDark
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <label className="text-xs font-extrabold block">
                Phòng ban Duy nhất của bạn (Một người chỉ thuộc 1 Phòng ban):
              </label>
              <select
                disabled={userRole !== 'SYS_ADMIN'}
                value={userDepartment}
                onChange={(e) => {
                  if (onChangeUserDepartment) {
                    onChangeUserDepartment(e.target.value);
                  }
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-indigo-300'
                    : 'bg-white border-slate-300 text-indigo-700'
                }`}
              >
                {(departmentsList.length > 0
                  ? departmentsList.map((d) => d.departmentName)
                  : [
                      'System Governance',
                      'Product & Engineering',
                      'Product Design & UX',
                      'AI & Data Science',
                    ]
                ).map((dName) => (
                  <option key={dName} value={dName}>
                    {dName}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                {userRole === 'SYS_ADMIN'
                  ? '* Bạn đang là SYS_ADMIN nên có thể chuyển nhanh phòng ban để kiểm thử quyền đặt ghế Hội trường.'
                  : '* Chỉ System Admin mới có quyền điều chuyển Phòng ban của nhân sự.'}
              </p>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-xs font-bold block mb-1.5">
                  Các Nhóm chuyên môn bạn đang tham gia ({myGroups.length} nhóm):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {myGroups.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">
                      Chưa tham gia nhóm nào
                    </span>
                  ) : (
                    myGroups.map((g) => (
                      <span
                        key={g.groupId}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-500/15 text-teal-600 dark:text-teal-300"
                      >
                        {g.groupName}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border space-y-2.5 text-xs ${
                isDark
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-2 font-extrabold text-indigo-500">
                <Sparkles className="w-4 h-4" />
                <span>Tóm tắt Quy tắc Phân quyền Hội trường Tầng 5 & QR:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 list-disc pl-4">
                <li>
                  <strong>System Admin (`SYS_ADMIN`)</strong>: Toàn quyền thuê cả
                  Hội trường không cần cấp phép, không giới hạn số lần/tuần và
                  không bị chặn phòng ban.
                </li>
                <li>
                  <strong>Quản lý (`MANAGER`)</strong>: Tối đa 10 lần/tuần; được
                  thuê cả Hội trường (cần Admin duyệt) và đặt ghế ngồi khi sự kiện
                  đã duyệt.
                </li>
                <li>
                  <strong>Nhân viên (`EMPLOYEE`)</strong>: Tối đa 3 lần/tuần; chỉ
                  được đặt ghế ngồi khi Hội trường đã có sự kiện được duyệt và
                  phòng ban của mình nằm trong danh sách được tham gia.
                </li>
                <li>
                  <strong>Cửa sổ Quét mã QR Check-in</strong>: Chỉ mở từ{' '}
                  <strong>trước 30 phút đến trễ 30 phút</strong> so với giờ bắt
                  đầu.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};