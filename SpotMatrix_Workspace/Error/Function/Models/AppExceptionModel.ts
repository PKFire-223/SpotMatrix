export class AppExceptionModel extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(messageText: string, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(messageText);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppExceptionModel.prototype);
  }
}

export function createValidationException(detailMessage: string): AppExceptionModel {
  return new AppExceptionModel(detailMessage, 400, 'VALIDATION_FAILED');
}

export function createUnauthorizedException(detailMessage: string): AppExceptionModel {
  return new AppExceptionModel(detailMessage, 401, 'AUTH_UNAUTHORIZED');
}

export function createForbiddenException(detailMessage: string): AppExceptionModel {
  return new AppExceptionModel(detailMessage, 403, 'AUTH_FORBIDDEN_ROLE');
}

export function createConflictException(detailMessage: string): AppExceptionModel {
  return new AppExceptionModel(detailMessage, 409, 'BOOKING_CONFLICT');
}