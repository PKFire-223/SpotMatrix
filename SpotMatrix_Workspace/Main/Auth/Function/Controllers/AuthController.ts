import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../Services/AuthService';
import { UserAccountDocument, UserAccountModel } from '../Models/UserAccountModel';
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

const authServiceMap = AuthService as unknown as Record<
  string,
  (...args: unknown[]) => Promise<unknown>
>;

export async function handleLoginAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const loginFn =
      authServiceMap.loginUserAccount ||
      authServiceMap.authenticateUserAccount ||
      authServiceMap.loginAccount;

    if (!loginFn) {
      throw new Error('Khong tim thay ham xu ly dang nhap trong AuthService.');
    }

    const result = await loginFn(req.body, clientIp);
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
    const registerFn =
      authServiceMap.registerUserAccount || authServiceMap.registerAccount;

    if (!registerFn) {
      throw new Error('Khong tim thay ham xu ly dang ky trong AuthService.');
    }

    const result = await registerFn(req.body);
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
    const requestOtpFn = authServiceMap.requestPasswordResetOtp;

    if (!requestOtpFn) {
      throw new Error('Khong tim thay ham requestPasswordResetOtp trong AuthService.');
    }

    const result =
      requestOtpFn.length <= 1 && typeof identifier === 'undefined'
        ? await requestOtpFn(req.body)
        : await requestOtpFn(identifier ?? req.body);

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
    const confirmOtpFn = authServiceMap.confirmPasswordResetWithOtp;

    if (!confirmOtpFn) {
      throw new Error('Khong tim thay ham confirmPasswordResetWithOtp trong AuthService.');
    }

    // Tự động tương thích cả chữ ký 1 tham số object ({ identifier, otpCode, newPassword }) và 3 tham số rời
    const result =
      confirmOtpFn.length <= 1
        ? await confirmOtpFn({ identifier, otpCode, newPassword })
        : await confirmOtpFn(identifier, otpCode, newPassword);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// Lấy thông tin Hồ sơ + Ảnh Avatar + Ảnh nền Background từ MongoDB theo username
export async function handleGetUserProfileFromMongo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawUsername = String(req.params.username || '').trim().toLowerCase();
    if (!rawUsername) {
      res.status(400).json({ success: false, message: 'Thieu username.' });
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

// Cập nhật trực tiếp Hồ sơ + Ảnh Avatar + Ảnh nền Background vào MongoDB Atlas
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

    const normalizedKey = String(username || '').trim().toLowerCase();
    if (!normalizedKey) {
      res.status(400).json({ success: false, message: 'Thieu username khi luu ho so.' });
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
            ...(userEmail ? { userEmail: String(userEmail).toLowerCase().trim() } : {}),
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
        message: 'Da luu Ho so, Avatar va Background vao MongoDB Atlas thanh cong!',
        data: updatedDoc,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Da luu Ho so, Avatar va Background vao bo nho tam!',
      data: memoryProfileCustomizationStore.get(normalizedKey),
    });
  } catch (err) {
    next(err);
  }
}