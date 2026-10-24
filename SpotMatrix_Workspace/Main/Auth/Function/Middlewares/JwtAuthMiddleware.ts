import { Request, Response, NextFunction } from 'express';
import { UserRoleType } from '../../../../Shared/Types/GlobalSystemTypes';
import { verifyJwtAccessToken } from '../Services/AuthService';
import {
  createForbiddenException,
  createUnauthorizedException,
} from '../../../../Error/Function/Models/AppExceptionModel';

export interface AuthenticatedRequest extends Request {
  authUser?: {
    username: string;
    email: string;
    role: UserRoleType;
  };
}

export function verifyJwtTokenMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      createUnauthorizedException('Phiên làm việc thiếu mã xác thực Bearer JWT Token.')
    );
  }

  const rawToken = authHeader.slice(7).trim();
  const verified = verifyJwtAccessToken(rawToken);
  if (!verified.valid || !verified.sub || !verified.role) {
    return next(
      createUnauthorizedException('Mã phiên đăng nhập (JWT) không hợp lệ hoặc đã hết hạn.')
    );
  }

  req.authUser = {
    username: verified.sub,
    email: verified.email || '',
    role: verified.role,
  };
  next();
}

export function requireAllowedRoles(allowedRoles: UserRoleType[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const roleFromToken = req.authUser?.role;
    const roleFromHeader = req.headers['x-spotmatrix-role'] as UserRoleType | undefined;
    const effectiveRole = roleFromToken || roleFromHeader;

    if (!effectiveRole || !allowedRoles.includes(effectiveRole)) {
      return next(
        createForbiddenException(
          `Truy cập bị từ chối! Chức năng này yêu cầu quyền [${allowedRoles.join(
            ' hoặc '
          )}].`
        )
      );
    }
    next();
  };
}