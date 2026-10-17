import { Router } from 'express';
import {
  handleConfirmPasswordReset,
  handleGetCurrentUserProfile,
  handleListUsers,
  handleRequestPasswordReset,
  handleSeedSampleUsers,
  handleUserLogin,
  handleUserRegister,
} from '../Controllers/AuthController';
import { requireAllowedRoles, verifyAccessToken } from '../Middlewares/JwtAuthMiddleware';

export const authRouter = Router();

authRouter.post('/login', handleUserLogin);
authRouter.post('/register', handleUserRegister);
authRouter.post('/forgot-password/request', handleRequestPasswordReset);
authRouter.post('/forgot-password/confirm', handleConfirmPasswordReset);
authRouter.post('/seed', handleSeedSampleUsers);

authRouter.get('/me', verifyAccessToken, handleGetCurrentUserProfile);
authRouter.get(
  '/users',
  verifyAccessToken,
  requireAllowedRoles(['SYS_ADMIN', 'MANAGER']),
  handleListUsers
);