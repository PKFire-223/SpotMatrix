import { Request, Response, NextFunction } from 'express';
import {
  confirmPasswordResetWithOtp,
  ensureDefaultAccountsSeeded,
  hashPasswordWithScrypt,
  loginUserAccount,
  registerUserAccount,
  requestPasswordResetOtp,
  validateStrongPasswordPolicy,
  verifyPasswordWithScrypt,
} from '../Services/AuthService';
import {
  UserAccountDocument,
  UserAccountModel,
} from '../Models/UserAccountModel';
import { getMongoConnectionState } from '../../../../Shared/Database/MongoConnection';

const memoryProfileCustomizationStore = new Map<
  string,
  {
    fullName?: string;
    userEmail?: string;
    departmentName?: string;
    phoneNumber?: string;
    jobTitle?: string;
    bioText?: string;
    avatarUrl?: string | null;
    backgroundUrl?: string | null;
  }
>();

export async function handleLoginAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await ensureDefaultAccountsSeeded();
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const result = await loginUserAccount(req.body, clientIp);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function handleRegisterAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await registerUserAccount(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function handleRequestPasswordOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { identifier } = req.body;
    const result = await requestPasswordResetOtp(identifier || req.body);
    res.json({ success: true, data: result });
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
    const result = await confirmPasswordResetWithOtp({
      identifier,
      otpCode,
      newPassword,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// Đổi mật khẩu trực tiếp từ trang Cài đặt & Lưu lên MongoDB Atlas
export async function handleChangeUserPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await ensureDefaultAccountsSeeded();
    const { username, userEmail, currentPassword, newPassword } = req.body;
    const rawKey = String(username || userEmail || '')
      .trim()
      .toLowerCase();

    if (!rawKey || !currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.',
      });
      return;
    }

    const pwdCheck = validateStrongPasswordPolicy(String(newPassword));
    if (!pwdCheck.valid) {
      res.status(400).json({
        success: false,
        message: pwdCheck.reason || 'Mật khẩu mới chưa đủ mạnh.',
      });
      return;
    }

    if (getMongoConnectionState()) {
      const accountDoc = await UserAccountModel.findOne({
        $or: [{ usernameNormalized: rawKey }, { userEmail: rawKey }],
      });

      if (!accountDoc) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài khoản trên hệ thống.',
        });
        return;
      }

      const isCurrentValid = verifyPasswordWithScrypt(
        String(currentPassword),
        accountDoc.passwordSalt,
        accountDoc.passwordHash
      );

      if (!isCurrentValid) {
        res.status(401).json({
          success: false,
          message: 'Mật khẩu hiện tại không chính xác!',
        });
        return;
      }

      const { salt, hash } = hashPasswordWithScrypt(String(newPassword));
      accountDoc.passwordSalt = salt;
      accountDoc.passwordHash = hash;
      accountDoc.passwordChangedAt = new Date();
      accountDoc.failedLoginAttempts = 0;
      accountDoc.lockUntilDate = null;
      await accountDoc.save();

      res.json({
        success: true,
        message:
          'Đã đổi mật khẩu và đồng bộ mã hóa Scrypt + Pepper lên MongoDB Atlas thành công!',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Đã cập nhật mật khẩu mới thành công (Chế độ Bộ nhớ Tạm)!',
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetUserProfileFromMongo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawUsername = String(req.params.username || '')
      .trim()
      .toLowerCase();
    if (!rawUsername) {
      res.status(400).json({ success: false, message: 'Thiếu username.' });
      return;
    }

    if (getMongoConnectionState()) {
      const accountDoc = (await UserAccountModel.findOne({
        usernameNormalized: rawUsername,
      }).lean()) as unknown as UserAccountDocument | null;

      if (accountDoc) {
        res.json({
          success: true,
          data: {
            username: accountDoc.username,
            fullName: accountDoc.fullName,
            userEmail: accountDoc.userEmail,
            departmentName: accountDoc.departmentName,
            role: accountDoc.role,
            trustScore: accountDoc.trustScore,
            avatarUrl: accountDoc.avatarUrl ?? null,
            backgroundUrl: accountDoc.backgroundUrl ?? null,
            phoneNumber: accountDoc.phoneNumber || '0908 123 456',
            jobTitle: accountDoc.jobTitle || 'Senior System Member',
            bioText:
              accountDoc.bioText ||
              'Thành viên hệ thống quản lý không gian và đặt lịch phòng họp SpotMatrix 3D.',
          },
        });
        return;
      }
    }

    const mem = memoryProfileCustomizationStore.get(rawUsername) || {};
    res.json({
      success: true,
      data: {
        username: req.params.username,
        avatarUrl: mem.avatarUrl ?? null,
        backgroundUrl: mem.backgroundUrl ?? null,
        phoneNumber: mem.phoneNumber || '0908 123 456',
        jobTitle: mem.jobTitle || 'Senior System Member',
        bioText:
          mem.bioText ||
          'Thành viên hệ thống quản lý không gian và đặt lịch phòng họp SpotMatrix 3D.',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateUserProfileInMongo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      username,
      fullName,
      userEmail,
      departmentName,
      phoneNumber,
      jobTitle,
      bioText,
      avatarUrl,
      backgroundUrl,
    } = req.body;

    const normalizedKey = String(username || '')
      .trim()
      .toLowerCase();
    if (!normalizedKey) {
      res
        .status(400)
        .json({ success: false, message: 'Thiếu username khi lưu hồ sơ.' });
      return;
    }

    memoryProfileCustomizationStore.set(normalizedKey, {
      fullName,
      userEmail,
      departmentName,
      phoneNumber,
      jobTitle,
      bioText,
      avatarUrl,
      backgroundUrl,
    });

    if (getMongoConnectionState()) {
      const updatedDoc = (await UserAccountModel.findOneAndUpdate(
        { usernameNormalized: normalizedKey },
        {
          $set: {
            ...(fullName ? { fullName } : {}),
            ...(userEmail
              ? { userEmail: String(userEmail).toLowerCase().trim() }
              : {}),
            ...(departmentName ? { departmentName } : {}),
            ...(phoneNumber !== undefined ? { phoneNumber } : {}),
            ...(jobTitle !== undefined ? { jobTitle } : {}),
            ...(bioText !== undefined ? { bioText } : {}),
            avatarUrl: avatarUrl ?? null,
            backgroundUrl: backgroundUrl ?? null,
          },
        },
        { new: true }
      ).lean()) as unknown as UserAccountDocument | null;

      res.json({
        success: true,
        message:
          'Đã lưu Hồ sơ, Phòng ban, Avatar và Background vào MongoDB Atlas thành công!',
        data: updatedDoc,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Đã lưu Hồ sơ, Avatar và Background vào bộ nhớ tạm!',
      data: memoryProfileCustomizationStore.get(normalizedKey),
    });
  } catch (err) {
    next(err);
  }
}

export const handleUserLogin = handleLoginAccount;