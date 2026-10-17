import { Router } from 'express';
import { handleUserLogin } from '../Controllers/AuthController';

export const authRouter = Router();
authRouter.post('/login', handleUserLogin);
