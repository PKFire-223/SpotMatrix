import { Request, Response, NextFunction } from 'express';
import { AppExceptionModel } from '../Models/AppExceptionModel';
import { recordSystemError } from '../Services/ErrorLoggerService';

export function handleGlobalException(
  errObj: Error | AppExceptionModel,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = errObj instanceof AppExceptionModel ? errObj.statusCode : 500;
  const errorCode = errObj instanceof AppExceptionModel ? errObj.errorCode : 'UNHANDLED_EXCEPTION';

  const loggedItem = recordSystemError(errorCode, errObj.message, req.originalUrl);

  res.status(statusCode).json({
    success: false,
    errorCode,
    message: errObj.message || 'He thong gap su co ngoai y muon, vui long thu lai.',
    traceId: loggedItem.logId,
    timestamp: loggedItem.timestampIso,
  });
}
