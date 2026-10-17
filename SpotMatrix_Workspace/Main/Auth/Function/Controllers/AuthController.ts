import { Request, Response } from 'express';
import { generateSessionToken } from '../Services/AuthService';

export function handleUserLogin(req: Request, res: Response): void {
  const { email } = req.body;
  res.json({ success: true, token: generateSessionToken(email || 'guest') });
}
