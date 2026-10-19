import { Router } from 'express';
import {
  handleConfirmPasswordReset,
  handleGetUserProfileFromMongo,
  handleLoginAccount,
  handleRegisterAccount,
  handleRequestPasswordOtp,
  handleUpdateUserProfileInMongo,
} from '../Controllers/AuthController';

export const authRouter = Router();

authRouter.post('/login', handleLoginAccount);
authRouter.post('/register', handleRegisterAccount);
authRouter.post('/forgot-password/request-otp', handleRequestPasswordOtp);
authRouter.post('/forgot-password/confirm', handleConfirmPasswordReset);

// API đọc và ghi Hồ sơ + Ảnh Avatar + Ảnh nền Background trực tiếp trên MongoDB Atlas
authRouter.get('/profile/:username', handleGetUserProfileFromMongo);
authRouter.put('/profile', handleUpdateUserProfileInMongo);