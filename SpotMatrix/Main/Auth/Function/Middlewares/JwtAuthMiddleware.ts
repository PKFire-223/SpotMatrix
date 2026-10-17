import { Request, Response, NextFunction } from 'express';

export function verifyAccessToken(_req: Request, _res: Response, next: NextFunction): void {
  next();
}
