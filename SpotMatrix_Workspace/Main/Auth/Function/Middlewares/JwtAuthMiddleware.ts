import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { loadSystemEnvConfig } from '../../../../Shared/Config/EnvConfig';
import { UserRoleType } from '../../../../Shared/Types/GlobalSystemTypes';
import { AppExceptionModel } from '../../../../Error/Function/Models/AppExceptionModel';

const envConfig = loadSystemEnvConfig();

export interface AuthenticatedRequest extends Request {
  authenticatedUser?: {
    accountCode: string;
    username: string;
    userEmail: string;
    role: UserRoleType;
    fullName: string;
  };
}

export function verifyAccessToken(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppExceptionModel(
        'Phiên đăng nhập không hợp lệ hoặc thiếu Bearer Token.',
        401,
        'UNAUTHORIZED_TOKEN'
      );
    }

    const rawToken = authHeader.slice(7);
    const decodedPayload = jwt.verify(rawToken, envConfig.jwtAccessSecret) as AuthenticatedRequest['authenticatedUser'];
    req.authenticatedUser = decodedPayload;
    next();
  } catch (err) {
    next(
      err instanceof AppExceptionModel
        ? err
        : new AppExceptionModel('Token đã hết hạn hoặc không hợp lệ.', 401, 'TOKEN_EXPIRED')
    );
  }
}

export function requireAllowedRoles(allowedRoles: UserRoleType[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const currentUser = req.authenticatedUser;
    if (!currentUser) {
      return next(new AppExceptionModel('Chưa xác thực người dùng.', 401, 'UNAUTHORIZED'));
    }
    if (!allowedRoles.includes(currentUser.role)) {
      return next(
        new AppExceptionModel(
          `Quyền truy cập bị từ chối: Chức năng này yêu cầu quyền [${allowedRoles.join(', ')}], tài khoản của bạn đang là [${currentUser.role}].`,
          403,
          'FORBIDDEN_ROLE'
        )
      );
    }
    next();
  };
}