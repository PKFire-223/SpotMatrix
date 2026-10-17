import { Request, Response, NextFunction } from 'express';
import {
  authenticateUserLogin,
  confirmPasswordResetWithOtp,
  listAllRegisteredUsers,
  registerUserAccount,
  requestPasswordResetOtp,
  seedDefaultAccountsToMongo,
} from '../Services/AuthService';
import { AuthenticatedRequest } from '../Middlewares/JwtAuthMiddleware';

export async function handleUserLogin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { identifier, email, password } = req.body;
    const loginResult = await authenticateUserLogin(identifier || email || '', password || '');
    res.json({
      success: true,
      message: `Chào mừng ${loginResult.userProfile.fullName} quay trở lại SpotMatrix!`,
      data: loginResult,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleUserRegister(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username, userEmail, password, fullName, departmentName, role } = req.body;
    const registerResult = await registerUserAccount({
      username,
      userEmail,
      rawPassword: password,
      fullName,
      departmentName,
      role,
    });
    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản SpotMatrix thành công và đã lưu vào cơ sở dữ liệu!',
      data: registerResult,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleRequestPasswordReset(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { identifier } = req.body;
    const otpPreview = await requestPasswordResetOtp(identifier);
    res.json({
      success: true,
      message: `Đã khởi tạo mã xác thực OTP 6 chữ số (hiệu lực ${otpPreview.expiresInMinutes} phút) cho ${otpPreview.maskedEmail}.`,
      data: otpPreview,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleConfirmPasswordReset(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { identifier, otpCode, newPassword } = req.body;
    const updatedUser = await confirmPasswordResetWithOtp({
      identifier,
      otpCode,
      newPassword,
    });
    res.json({
      success: true,
      message: 'Đặt lại mật khẩu mới thành công! Bạn có thể đăng nhập ngay bây giờ.',
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetCurrentUserProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  res.json({
    success: true,
    data: req.authenticatedUser,
  });
}

export async function handleListUsers(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await listAllRegisteredUsers();
    res.json({ success: true, totalCount: users.length, data: users });
  } catch (err) {
    next(err);
  }
}

export async function handleSeedSampleUsers(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const seedInfo = await seedDefaultAccountsToMongo();
    res.json({
      success: true,
      message: 'Đã nạp thành công dữ liệu tài khoản mẫu (Admin, Manager, Employee) vào MongoDB.',
      data: seedInfo,
    });
  } catch (err) {
    next(err);
  }
}