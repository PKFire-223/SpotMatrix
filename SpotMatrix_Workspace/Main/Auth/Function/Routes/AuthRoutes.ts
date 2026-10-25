import { Router } from 'express';
import {
  handleChangeUserPassword,
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
authRouter.post('/password-otp', handleRequestPasswordOtp);
authRouter.post('/password-reset', handleConfirmPasswordReset);
authRouter.post('/change-password', handleChangeUserPassword);
authRouter.get('/profile/:username', handleGetUserProfileFromMongo);
authRouter.put('/profile', handleUpdateUserProfileInMongo);