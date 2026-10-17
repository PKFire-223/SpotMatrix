import React, { useState, useMemo, useEffect } from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
  Clock,
  QrCode,
  Layers,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  User,
  Building2,
  KeyRound,
  Activity,
  Zap,
} from 'lucide-react';
import { SpotMatrixLogo } from '../../../Shared/Components/SpotMatrixLogo';
import { UserRoleType } from '../../../Shared/Types/GlobalSystemTypes';

export interface AuthenticatedUserSession {
  accessToken: string;
  userProfile: {
    accountCode: string;
    username: string;
    userEmail: string;
    fullName: string;
    departmentName: string;
    role: UserRoleType;
    trustScore: number;
  };
}

interface LoginPagesProps {
  onLoginSuccess: (sessionData: AuthenticatedUserSession) => void;
}

type AuthTabMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

interface SimulatedSpotCell {
  code: string;
  label: string;
  zone: string;
  status: 'AVAILABLE' | 'HOLDING' | 'BOOKED' | 'OCCUPIED';
  timerText?: string;
  aiMatch: number;
}

const INITIAL_MATRIX_CELLS: SimulatedSpotCell[] = [
  { code: 'A-01', label: 'Desk Pod 4K', zone: 'Zone A', status: 'AVAILABLE', aiMatch: 98 },
  { code: 'A-02', label: 'Dev Station', zone: 'Zone A', status: 'OCCUPIED', aiMatch: 89 },
  { code: 'A-03', label: 'Ergo Desk', zone: 'Zone A', status: 'HOLDING', timerText: '04:42', aiMatch: 94 },
  { code: 'M-01', label: 'Boardroom 8P', zone: 'Zone M', status: 'AVAILABLE', aiMatch: 96 },
  { code: 'F-01', label: 'Focus Booth', zone: 'Silent', status: 'BOOKED', timerText: '14:00', aiMatch: 91 },
  { code: 'C-01', label: 'Collab Hub 6P', zone: 'Creative', status: 'AVAILABLE', aiMatch: 95 },
  { code: 'B-01', label: 'Design Wacom', zone: 'Zone B', status: 'AVAILABLE', aiMatch: 92 },
  { code: 'B-02', label: 'Dual Screen', zone: 'Zone B', status: 'HOLDING', timerText: '03:18', aiMatch: 87 },
  { code: 'M-02', label: 'Pitch Room', zone: 'Zone M', status: 'OCCUPIED', aiMatch: 90 },
];

export const LoginPages: React.FC<LoginPagesProps> = ({ onLoginSuccess }) => {
  // Mac dinh la che do SANG ('light'), cho phep chuyen doi SANG / TOI muot ma
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('spotmatrix_theme_mode');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const isDark = themeMode === 'dark';

  const toggleThemeMode = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setThemeMode(nextTheme);
    localStorage.setItem('spotmatrix_theme_mode', nextTheme);
  };

  const [activeTab, setActiveTab] = useState<AuthTabMode>('LOGIN');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Hieu ung dong cho Ma tran 2D ben trai (tu dong chuyen trang thai de mo phong Real-time SSE)
  const [matrixCells, setMatrixCells] = useState<SimulatedSpotCell[]>(INITIAL_MATRIX_CELLS);
  const [activeFeedIndex, setActiveFeedIndex] = useState(0);

  const liveActivityFeeds = [
    {
      icon: Zap,
      badge: 'Optimistic Lock v2',
      text: 'Nguyễn Minh Quân vừa giữ chỗ bàn A-03 (Đếm ngược 05:00 phút)',
      color: 'text-amber-500',
    },
    {
      icon: QrCode,
      badge: 'QR Check-in +2đ',
      text: 'Lê Thu Hà quét QR đúng giờ tại Phòng họp M-02 (Tín nhiệm: 100đ)',
      color: 'text-emerald-500',
    },
    {
      icon: ShieldCheck,
      badge: 'Auto-Release Cron',
      text: 'Hệ thống tự động giải phóng bàn B-01 do quá 15 phút không Check-in',
      color: 'text-indigo-500',
    },
  ];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveFeedIndex((prev) => (prev + 1) % liveActivityFeeds.length);
      setMatrixCells((prevCells) =>
        prevCells.map((cell, idx) => {
          if (idx === 0) {
            return {
              ...cell,
              status: cell.status === 'AVAILABLE' ? 'HOLDING' : 'AVAILABLE',
              timerText: cell.status === 'AVAILABLE' ? '04:59' : undefined,
            };
          }
          if (idx === 5) {
            return {
              ...cell,
              status: cell.status === 'AVAILABLE' ? 'BOOKED' : 'AVAILABLE',
            };
          }
          return cell;
        })
      );
    }, 3200);
    return () => clearInterval(intervalId);
  }, [liveActivityFeeds.length]);

  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regDepartment, setRegDepartment] = useState('Product & Engineering');
  const [regRole, setRegRole] = useState<UserRoleType>('EMPLOYEE');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot Password State
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [otpInput, setOtpInput] = useState('');
  const [simulatedOtpDisplay, setSimulatedOtpDisplay] = useState<string | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Kiem tra 4 dieu kien mat khau theo thoi gian thuc
  const activePasswordToEvaluate =
    activeTab === 'REGISTER' ? regPassword : activeTab === 'FORGOT_PASSWORD' ? resetNewPassword : '';

  const passwordRulesStatus = useMemo(() => {
    return {
      hasMinLength: activePasswordToEvaluate.length >= 8,
      hasLowercase: /[a-z]/.test(activePasswordToEvaluate),
      hasUppercase: /[A-Z]/.test(activePasswordToEvaluate),
      hasNumber: /[0-9]/.test(activePasswordToEvaluate),
    };
  }, [activePasswordToEvaluate]);

  const isPasswordRuleSatisfied =
    passwordRulesStatus.hasMinLength &&
    passwordRulesStatus.hasLowercase &&
    passwordRulesStatus.hasUppercase &&
    passwordRulesStatus.hasNumber;

  const passwordStrengthCount = Object.values(passwordRulesStatus).filter(Boolean).length;

  const handleQuickFillDemoAccount = (username: string, pass: string) => {
    setActiveTab('LOGIN');
    setErrorBanner(null);
    setSuccessBanner(`Đã điền nhanh tài khoản mẫu "${username}". Bấm Đăng nhập để vào hệ thống!`);
    setLoginIdentifier(username);
    setLoginPassword(pass);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setSuccessBanner(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Đăng nhập thất bại.');
      }
      onLoginSuccess(result.data);
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : 'Không thể kết nối tới Server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setSuccessBanner(null);

    if (!isPasswordRuleSatisfied) {
      setErrorBanner('Mật khẩu chưa đáp ứng đủ 4 điều kiện bảo mật bên dưới.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorBanner('Mật khẩu nhập lại không khớp.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          userEmail: regEmail,
          fullName: regFullName,
          departmentName: regDepartment,
          role: regRole,
          password: regPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Đăng ký thất bại.');
      }
      onLoginSuccess(result.data);
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ khi đăng ký.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setSuccessBanner(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không tìm thấy tài khoản.');
      }
      setSimulatedOtpDisplay(result.data.simulatedOtpCode);
      setOtpInput(result.data.simulatedOtpCode);
      setForgotStep(2);
      setSuccessBanner(result.message);
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : 'Lỗi khi yêu cầu mã OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setSuccessBanner(null);

    if (!isPasswordRuleSatisfied) {
      setErrorBanner('Mật khẩu mới phải đạt đủ 4 tiêu chuẩn bảo mật.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/forgot-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forgotIdentifier,
          otpCode: otpInput,
          newPassword: resetNewPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Đặt lại mật khẩu thất bại.');
      }
      setSuccessBanner('Đặt lại mật khẩu thành công! Mời bạn đăng nhập bằng mật khẩu mới.');
      setLoginIdentifier(forgotIdentifier);
      setLoginPassword(resetNewPassword);
      setSimulatedOtpDisplay(null);
      setForgotStep(1);
      setActiveTab('LOGIN');
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : 'Lỗi khi xác nhận đặt lại mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentFeedIcon = liveActivityFeeds[activeFeedIndex].icon;

  return (
    <div
      className={`min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* =====================================================================
          NUA BEN TRAI (7/12 COT): KHONG GIAN GIOI THIEU DAC BIET + HIEU UNG DONG
         ===================================================================== */}
      <div
        className={`lg:col-span-7 relative overflow-hidden flex flex-col justify-between p-6 sm:p-10 xl:p-14 border-b lg:border-b-0 lg:border-r transition-colors duration-300 ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-950 border-slate-800'
            : 'bg-gradient-to-br from-indigo-50/90 via-white to-emerald-50/70 border-slate-200/80'
        }`}
      >
        {/* Luoi Toa do Matrix Trang tri Toan Man Hinh */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: isDark
              ? 'radial-gradient(rgba(99, 102, 241, 0.28) 1.5px, transparent 1.5px)'
              : 'radial-gradient(rgba(79, 70, 229, 0.18) 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Qua cau anh sang chuyen dong mem mai phia sau */}
        <div
          className={`pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl animate-float-slow ${
            isDark ? 'bg-indigo-600/25' : 'bg-indigo-400/25'
          }`}
        />
        <div
          className={`pointer-events-none absolute bottom-10 right-10 w-80 h-80 rounded-full blur-3xl animate-float-reverse ${
            isDark ? 'bg-emerald-500/20' : 'bg-emerald-400/25'
          }`}
        />

        {/* HANG TREN CUNG: LOGO SPOTMATRIX & TRANG THAI SERVER */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <SpotMatrixLogo theme={isDark ? 'dark' : 'light'} variant="full" />

          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border shadow-sm backdrop-blur-md ${
              isDark
                ? 'bg-slate-900/80 border-emerald-500/30 text-emerald-300'
                : 'bg-white/90 border-emerald-200 text-emerald-700'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            MongoDB Atlas Online • Real-Time 2D Engine
          </div>
        </div>

        {/* KHU VUC TRUNG TAM: TIEU DE LON + BAN DO MA TRAN 2D TUONG TAC DONG */}
        <div className="relative z-10 my-8 space-y-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Smart Workspace & Floorplan Matrix Platform
            </div>
            <h1
              className={`text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight leading-[1.15] ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Đặt chỗ Không gian Làm việc Trực tiếp trên{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Sơ đồ Mặt bằng 2D
              </span>
            </h1>
            <p
              className={`text-sm sm:text-base leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Giải quyết triệt để bài toán đặt trùng ghế bằng <strong>Optimistic Locking</strong>, tự động giữ chỗ tạm thời <strong>5 phút</strong>, quét mã <strong>QR Check-in</strong> cộng điểm tín nhiệm và thu hồi vị trí bỏ trống sau <strong>15 phút</strong>.
            </p>
          </div>

          {/* MO HINH MA TRAN SO DO 2D DONG (LIVE INTERACTIVE RADAR SHOWCASE) */}
          <div className="relative">
            {/* The Floating Card 1: Thong bao Real-time ben tren */}
            <div
              className={`mb-3 p-3.5 rounded-2xl border shadow-lg backdrop-blur-md flex items-center gap-3 transition-all duration-500 animate-float-slow ${
                isDark
                  ? 'bg-slate-900/90 border-slate-700/80 text-slate-100'
                  : 'bg-white/95 border-indigo-100 text-slate-800 shadow-indigo-500/5'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 flex items-center justify-center shrink-0">
                <CurrentFeedIcon className={`w-5 h-5 ${liveActivityFeeds[activeFeedIndex].color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {liveActivityFeeds[activeFeedIndex].badge}
                  </span>
                  <span className="text-[10px] text-slate-400">• Vừa xong</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold truncate">
                  {liveActivityFeeds[activeFeedIndex].text}
                </p>
              </div>
            </div>

            {/* Khung Ban do Mat bang 2D co Tia Quet Radar */}
            <div
              className={`relative rounded-3xl border p-4 sm:p-5 overflow-hidden shadow-xl transition-colors ${
                isDark
                  ? 'bg-slate-900/85 border-slate-800 shadow-black/40'
                  : 'bg-white/90 border-slate-200/90 shadow-indigo-500/10'
              }`}
            >
              {/* Tia quet Radar chuyen dong doc */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-indigo-500/10 to-emerald-500/20 border-b border-emerald-400/40 animate-radar-sweep" />

              <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    Mô phỏng Mặt bằng Tầng 1 — Live Matrix 2D
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-semibold">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Trống
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Giữ 5p
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" /> Đã đặt
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Đang ngồi
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {matrixCells.map((cell) => {
                  const statusStyles = {
                    AVAILABLE: isDark
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : 'bg-emerald-50/90 border-emerald-300 text-emerald-900',
                    HOLDING: isDark
                      ? 'bg-amber-950/60 border-amber-500/60 text-amber-200 animate-pulse'
                      : 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse',
                    BOOKED: isDark
                      ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-200'
                      : 'bg-indigo-50/90 border-indigo-300 text-indigo-900',
                    OCCUPIED: isDark
                      ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                      : 'bg-rose-50/80 border-rose-200 text-rose-900',
                  };

                  const dotColor = {
                    AVAILABLE: 'bg-emerald-500',
                    HOLDING: 'bg-amber-500',
                    BOOKED: 'bg-indigo-500',
                    OCCUPIED: 'bg-rose-500',
                  };

                  return (
                    <div
                      key={cell.code}
                      className={`p-3 rounded-2xl border transition-all duration-500 hover:scale-[1.02] flex flex-col justify-between ${statusStyles[cell.status]}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-black tracking-tight">
                          {cell.code}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${dotColor[cell.status]}`} />
                      </div>
                      <p className="text-[11px] font-semibold opacity-85 truncate mt-0.5">
                        {cell.label}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-current/10 text-[10px] font-bold">
                        <span>{cell.zone}</span>
                        <span>{cell.timerText ? `⏱ ${cell.timerText}` : `AI ${cell.aiMatch}%`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* HANG DUOI CUNG: 3 THE DIEN NHANH TAI KHOAN MAU (1-CLICK DEMO FILL) */}
        <div className="relative z-10 space-y-2.5 pt-4 border-t border-slate-300/60 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-indigo-400' : 'text-indigo-700'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Chế độ Điền nhanh Tài khoản Mẫu (Click để tự điền vào ô Đăng nhập)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickFillDemoAccount('Systemadmin123', 'Password123')}
              className={`p-3 rounded-2xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 hover:border-rose-500/60'
                  : 'bg-white border-slate-200/90 hover:border-rose-400 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-300">
                  SYS_ADMIN
                </span>
                <ArrowRight className="w-3.5 h-3.5 opacity-50" />
              </div>
              <p className="text-xs font-bold truncate">Systemadmin123</p>
              <p className="text-[11px] opacity-70">MK: Password123</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFillDemoAccount('Managerlead123', 'Password123')}
              className={`p-3 rounded-2xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 hover:border-amber-500/60'
                  : 'bg-white border-slate-200/90 hover:border-amber-400 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300">
                  MANAGER
                </span>
                <ArrowRight className="w-3.5 h-3.5 opacity-50" />
              </div>
              <p className="text-xs font-bold truncate">Managerlead123</p>
              <p className="text-[11px] opacity-70">MK: Password123</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFillDemoAccount('Employeedev123', 'Password123')}
              className={`p-3 rounded-2xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/60'
                  : 'bg-white border-slate-200/90 hover:border-emerald-400 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                  EMPLOYEE
                </span>
                <ArrowRight className="w-3.5 h-3.5 opacity-50" />
              </div>
              <p className="text-xs font-bold truncate">Employeedev123</p>
              <p className="text-[11px] opacity-70">MK: Password123</p>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          NUA BEN PHAI (5/12 COT): BIEU MAU XAC THUC + NUT CHUYEN SANG / TOI
         ===================================================================== */}
      <div
        className={`lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 xl:p-14 transition-colors duration-300 ${
          isDark ? 'bg-slate-950' : 'bg-white'
        }`}
      >
        {/* THANH CONG CU PHIA TREN BEN PHAI: CHUYEN CHE DO SANG / TOI */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold opacity-75">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Bảo mật PBKDF2 / Scrypt + JWT Role Guard</span>
          </div>

          <button
            type="button"
            onClick={toggleThemeMode}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-amber-300 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                Chế độ Sáng
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                Chế độ Tối
              </>
            )}
          </button>
        </div>

        {/* KHU VUC FORM CHINH O GIUA */}
        <div className="my-auto py-6 max-w-md w-full mx-auto space-y-6">
          {/* Thanh Chuyen Tab: Dang nhap | Dang ky | Quen mat khau */}
          <div
            className={`flex rounded-2xl p-1.5 border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200/80'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('LOGIN');
                setErrorBanner(null);
                setSuccessBanner(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'LOGIN'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('REGISTER');
                setErrorBanner(null);
                setSuccessBanner(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'REGISTER'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng ký Mới
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('FORGOT_PASSWORD');
                setErrorBanner(null);
                setSuccessBanner(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'FORGOT_PASSWORD'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quên mật khẩu
            </button>
          </div>

          {/* Banner Thong bao Loi / Thanh cong */}
          {errorBanner && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-start justify-between gap-2 ${
                isDark
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorBanner}</span>
              </div>
              <button onClick={() => setErrorBanner(null)} className="font-bold opacity-70">
                ✕
              </button>
            </div>
          )}

          {successBanner && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-start justify-between gap-2 ${
                isDark
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successBanner}</span>
              </div>
              <button onClick={() => setSuccessBanner(null)} className="font-bold opacity-70">
                ✕
              </button>
            </div>
          )}

          {/* ===============================================================
              TAB 1: FORM DANG NHAP
             =============================================================== */}
          {activeTab === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  Chào mừng trở lại SpotMatrix
                </h2>
                <p
                  className={`text-xs sm:text-sm mt-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Đăng nhập bằng Tên tài khoản (VD:{' '}
                  <code className="font-bold text-indigo-600 dark:text-indigo-400">
                    Systemadmin123
                  </code>
                  ) hoặc Email công việc của bạn.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    Tên đăng nhập hoặc Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Systemadmin123 hoặc email@spotmatrix.vn"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3.5 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold">Mật khẩu bảo mật</label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('FORGOT_PASSWORD')}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Nhập mật khẩu (VD: Password123)"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={`w-full pl-10 pr-11 py-3.5 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>
                  {isLoading ? 'Đang xác thực phiên làm việc...' : 'Đăng nhập vào Bảng Tổng quan'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ===============================================================
              TAB 2: FORM DANG KY TAI KHOAN MOI (LUU VAO MONGODB)
             =============================================================== */}
          {activeTab === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Khởi tạo Tài khoản Mới</h2>
                <p
                  className={`text-xs mt-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Tài khoản mới được cấp ngay <strong>100 điểm Tín nhiệm</strong> và lưu chuẩn hóa vào bảng{' '}
                  <code className="font-bold text-emerald-600 dark:text-emerald-400">
                    spotmatrix_user_accounts
                  </code>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Tên đăng nhập *</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="VD: Quangdev123"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Email công việc *</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="quang@spotmatrix.vn"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold mb-1">Họ và Tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn Quang"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Phòng ban</label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      className={`w-full pl-8 pr-2.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Vai trò (Role)</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRoleType)}
                    className={`w-full px-2.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="EMPLOYEE">EMPLOYEE (Nhân viên)</option>
                    <option value="MANAGER">MANAGER (Quản lý)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Mật khẩu *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Từ 8 ký tự, Hoa, thường, số"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Xác nhận mật khẩu *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Nhập lại mật khẩu"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Thanh Tien trinh & 4 Dieu kien Mat khau */}
              <div
                className={`p-3.5 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">Độ mạnh mật khẩu:</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                    {passwordStrengthCount}/4 tiêu chuẩn
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 h-full transition-all duration-300 ${
                        passwordStrengthCount >= step
                          ? passwordStrengthCount === 4
                            ? 'bg-emerald-500'
                            : 'bg-indigo-500'
                          : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                  <div
                    className={
                      passwordRulesStatus.hasMinLength
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }
                  >
                    {passwordRulesStatus.hasMinLength ? '✓' : '○'} Ít nhất 8 ký tự
                  </div>
                  <div
                    className={
                      passwordRulesStatus.hasUppercase
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }
                  >
                    {passwordRulesStatus.hasUppercase ? '✓' : '○'} Có chữ viết hoa (A-Z)
                  </div>
                  <div
                    className={
                      passwordRulesStatus.hasLowercase
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }
                  >
                    {passwordRulesStatus.hasLowercase ? '✓' : '○'} Có chữ viết thường (a-z)
                  </div>
                  <div
                    className={
                      passwordRulesStatus.hasNumber
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }
                  >
                    {passwordRulesStatus.hasNumber ? '✓' : '○'} Có chữ số (0-9)
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5"
              >
                {isLoading ? 'Đang đồng bộ lên MongoDB...' : 'Hoàn tất Đăng ký & Vào Hệ thống'}
              </button>
            </form>
          )}

          {/* ===============================================================
              TAB 3: QUEN MAT KHAU 2 BUOC (OTP 6 SO)
             =============================================================== */}
          {activeTab === 'FORGOT_PASSWORD' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Khôi phục Mật khẩu</h2>
                <p
                  className={`text-xs mt-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Bước {forgotStep}/2: Xác thực bằng mã OTP 6 chữ số có thời hạn 10 phút
                </p>
              </div>

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestOtpSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Tên đăng nhập hoặc Email đã đăng ký
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Systemadmin123 hoặc employee.dev@spotmatrix.vn"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/25 transition"
                  >
                    {isLoading ? 'Đang khởi tạo mã OTP...' : 'Nhận Mã Xác Thực OTP (6 chữ số)'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmResetSubmit} className="space-y-3.5">
                  {simulatedOtpDisplay && (
                    <div
                      className={`p-3.5 rounded-2xl border text-xs ${
                        isDark
                          ? 'bg-indigo-950/70 border-indigo-500/40 text-indigo-200'
                          : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                      }`}
                    >
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-300">
                        [Chế độ Giả lập Gmail Dev]
                      </span>{' '}
                      Mã OTP của bạn là:{' '}
                      <code className="px-2 py-0.5 rounded bg-indigo-600 text-white font-black text-sm">
                        {simulatedOtpDisplay}
                      </code>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold mb-1">Mã OTP 6 chữ số</label>
                    <input
                      type="text"
                      required
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className={`w-full px-4 py-3 rounded-2xl border text-sm font-black tracking-widest ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">
                      Mật khẩu mới (Đủ 4 tiêu chuẩn)
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Nhập mật khẩu mới..."
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className={`w-full px-4 py-3 rounded-2xl border text-sm ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className={`px-4 py-3 rounded-2xl text-xs font-bold border ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-300'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      Quay lại
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20"
                    >
                      Xác nhận Đổi Mật khẩu Mới
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* CHAN TRANG BEN PHAI */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] opacity-60 pt-4 border-t border-slate-200 dark:border-slate-800">
          <span>© 2026 SpotMatrix Workspace Platform</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Hold 5m • Grace Check-in 15m
          </span>
        </div>
      </div>
    </div>
  );
};