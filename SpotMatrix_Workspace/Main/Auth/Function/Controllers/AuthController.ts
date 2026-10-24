import { Request, Response, NextFunction } from 'express';
import {
  confirmPasswordResetWithOtp,
  ensureDefaultAccountsSeeded,
  loginUserAccount,
  registerUserAccount,
  requestPasswordResetOtp,
} from '../Services/AuthService';
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

export const handleUserLogin = handleLoginAccount;