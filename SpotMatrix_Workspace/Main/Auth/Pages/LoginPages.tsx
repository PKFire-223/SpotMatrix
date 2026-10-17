import React, { useState, useMemo } from 'react';
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

export const LoginPages: React.FC<LoginPagesProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<AuthTabMode>('LOGIN');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

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
    setSuccessBanner(null);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center relative overflow-hidden py-8 px-4 sm:px-6 lg:px-8">
      {/* Hieu ung anh sang nen (Ambient Matrix Glow) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden">
        {/* COT TRAI: BRAND SHOWCASE & DEMO ROLE MATRIX */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-950 p-6 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="space-y-6">
            <SpotMatrixLogo theme="dark" variant="full" />

            <div className="space-y-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Spatial Workspace Matrix v2.0
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Quản lý Dữ liệu & Đặt chỗ Mặt bằng 2D Thời gian thực
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Hệ thống kiểm soát đồng thời (Optimistic Locking), giữ chỗ thông minh 5 phút, tự động thu hồi No-Show sau 15 phút và tính điểm tín nhiệm người dùng.
              </p>
            </div>

            {/* Minh hoa truc quan Ma tran trang thai ghe */}
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">Trạng thái Sơ đồ Tầng 1 (Live)</span>
                <span className="text-emerald-400 font-semibold">MongoDB Connected</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold">
                  <div className="text-base font-extrabold text-white">A-01</div>
                  Trống • AI 96%
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold">
                  <div className="text-base font-extrabold text-white">F-01</div>
                  Giữ chỗ (04:12)
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold">
                  <div className="text-base font-extrabold text-white">M-01</div>
                  Phòng họp 8P
                </div>
              </div>
            </div>
          </div>

          {/* KHU VUC DIEN NHANH TAI KHOAN MAU CHO DEV TEST */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Chế độ Điền nhanh Tài khoản Mẫu (1-Click Test)
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFillDemoAccount('Systemadmin123', 'Password123')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-950/90 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/50 transition flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-indigo-300">
                    1. Admin Hệ thống (SYS_ADMIN)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    TK: <code className="text-emerald-300">Systemadmin123</code> • MK:{' '}
                    <code className="text-emerald-300">Password123</code>
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                  FULL QUYỀN
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFillDemoAccount('Managerlead123', 'Password123')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-950/90 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/50 transition flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-indigo-300">
                    2. Quản lý Không gian (MANAGER)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    TK: <code className="text-cyan-300">Managerlead123</code> • MK:{' '}
                    <code className="text-cyan-300">Password123</code>
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  QUẢN LÝ
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFillDemoAccount('Employeedev123', 'Password123')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-950/90 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/50 transition flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-indigo-300">
                    3. Nhân viên Văn phòng (EMPLOYEE)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    TK: <code className="text-indigo-300">Employeedev123</code> • MK:{' '}
                    <code className="text-indigo-300">Password123</code>
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  NHÂN VIÊN
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* COT PHAI: FORM DANG NHAP / DANG KY / QUEN MAT KHAU */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          {/* Thanh chuyen Tab */}
          <div className="flex rounded-2xl bg-slate-950 p-1.5 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('LOGIN');
                setErrorBanner(null);
                setSuccessBanner(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'LOGIN'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
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
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'REGISTER'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đăng ký Tài khoản
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('FORGOT_PASSWORD');
                setErrorBanner(null);
                setSuccessBanner(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'FORGOT_PASSWORD'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quên mật khẩu
            </button>
          </div>

          {/* Thong bao Loi / Thanh cong */}
          {errorBanner && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs font-medium flex items-center justify-between">
              <span>⚠️ {errorBanner}</span>
              <button onClick={() => setErrorBanner(null)} className="text-rose-300 font-bold ml-2">
                ✕
              </button>
            </div>
          )}

          {successBanner && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-medium flex items-center justify-between">
              <span>✓ {successBanner}</span>
              <button
                onClick={() => setSuccessBanner(null)}
                className="text-emerald-300 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: FORM DANG NHAP */}
          {activeTab === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">Đăng nhập Hệ thống SpotMatrix</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Nhập Tên tài khoản (VD: <code className="text-indigo-300">Systemadmin123</code>) hoặc địa chỉ Email của bạn
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tên đăng nhập hoặc Email
                </label>
                <input
                  type="text"
                  required
                  placeholder="Systemadmin123 hoặc email@spotmatrix.vn"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Mật khẩu bảo mật</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    {showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập mật khẩu (VD: Password123)"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
              >
                {isLoading ? 'Đang xác thực dữ liệu...' : 'Đăng nhập vào Không gian Làm việc'}
              </button>
            </form>
          )}

          {/* TAB 2: FORM DANG KY TAI KHOAN MOI (LUU VAO MONGODB) */}
          {activeTab === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <h2 className="text-xl font-extrabold text-white">Tạo Tài khoản SpotMatrix Mới</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dữ liệu được chuẩn hóa và lưu trực tiếp vào bảng <code className="text-emerald-400">spotmatrix_user_accounts</code> trong MongoDB (Khởi đầu với 100 điểm Tín nhiệm)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tên đăng nhập (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Quangdev123"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Địa chỉ Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="quang@spotmatrix.vn"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Họ và Tên *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn Quang"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phòng ban / Nhóm
                  </label>
                  <input
                    type="text"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Vai trò đăng ký
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRoleType)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  >
                    <option value="EMPLOYEE">Nhân viên (EMPLOYEE)</option>
                    <option value="MANAGER">Quản lý (MANAGER)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mật khẩu mới *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Tối thiểu 8 ký tự, Hoa, thường, số"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nhập lại mật khẩu *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Xác nhận lại mật khẩu"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>
              </div>

              {/* Thanh do do manh mat khau 4 tieu chi */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-300">
                    Tiêu chuẩn Bảo mật Mật khẩu:
                  </span>
                  <span className="font-bold text-indigo-400">
                    Đạt {passwordStrengthCount}/4 điều kiện
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div
                    className={
                      passwordRulesStatus.hasMinLength ? 'text-emerald-400 font-semibold' : 'text-slate-500'
                    }
                  >
                    {passwordRulesStatus.hasMinLength ? '✓' : '○'} Ít nhất 8 ký tự
                  </div>
                  <div
                    className={
                      passwordRulesStatus.hasUppercase ? 'text-emerald-400 font-semibold' : 'text-slate-500'
                    }
                  >
                    {passwordRulesStatus.hasUppercase ? '✓' : '○'} Có chữ viết hoa (A-Z)
                  </div>
                  <div
                    className={
                      passwordRulesStatus.hasLowercase ? 'text-emerald-400 font-semibold' : 'text-slate-500'
                    }
                  >
                    {passwordRulesStatus.hasLowercase ? '✓' : '○'} Có chữ viết thường (a-z)
                  </div>
                  <div
                    className={
                      passwordRulesStatus.hasNumber ? 'text-emerald-400 font-semibold' : 'text-slate-500'
                    }
                  >
                    {passwordRulesStatus.hasNumber ? '✓' : '○'} Có ít nhất 1 chữ số (0-9)
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
              >
                {isLoading ? 'Đang ghi vào MongoDB...' : 'Hoàn tất Đăng ký & Đăng nhập'}
              </button>
            </form>
          )}

          {/* TAB 3: QUEN MAT KHAU 2 BUOC */}
          {activeTab === 'FORGOT_PASSWORD' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">Khôi phục Mật khẩu Bảo mật</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Bước {forgotStep}/2: Hệ thống sinh mã OTP 6 số lưu trong MongoDB (Sẵn sàng tích hợp gửi Gmail SMTP ở bản mở rộng)
                </p>
              </div>

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestOtpSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nhập Tên đăng nhập hoặc Email của bạn
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Systemadmin123 hoặc employee.dev@spotmatrix.vn"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition"
                  >
                    {isLoading ? 'Đang tạo mã OTP...' : 'Nhận Mã Xác Nhận OTP (6 chữ số)'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmResetSubmit} className="space-y-3.5">
                  {simulatedOtpDisplay && (
                    <div className="p-3 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-xs text-indigo-200">
                      <span className="font-bold text-emerald-300">[Chế độ Giả lập Gmail Dev]</span> Mã OTP 6 số của bạn là:{' '}
                      <code className="px-2 py-0.5 rounded bg-slate-900 text-white font-extrabold text-sm">
                        {simulatedOtpDisplay}
                      </code>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Mã OTP 6 chữ số
                    </label>
                    <input
                      type="text"
                      required
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-bold tracking-widest"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Mật khẩu mới (Tối thiểu 8 ký tự, có chữ Hoa, chữ thường và số)
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Nhập mật khẩu mới..."
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className={passwordRulesStatus.hasMinLength ? 'text-emerald-400' : 'text-slate-500'}>
                      ✓ Ít nhất 8 ký tự
                    </span>
                    <span className={passwordRulesStatus.hasUppercase ? 'text-emerald-400' : 'text-slate-500'}>
                      ✓ Có chữ viết hoa (A-Z)
                    </span>
                    <span className={passwordRulesStatus.hasLowercase ? 'text-emerald-400' : 'text-slate-500'}>
                      ✓ Có chữ thường (a-z)
                    </span>
                    <span className={passwordRulesStatus.hasNumber ? 'text-emerald-400' : 'text-slate-500'}>
                      ✓ Có chữ số (0-9)
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                    >
                      Quay lại
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Xác nhận Đổi Mật khẩu Mới
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};