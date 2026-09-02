// Stable error codes — imported by controllers and the error handler.
export const ErrorCode = {
  // Auth
  UNAUTHORIZED:          'UNAUTHORIZED',
  FORBIDDEN:             'FORBIDDEN',
  TOKEN_EXPIRED:         'TOKEN_EXPIRED',
  INVALID_OTP:           'INVALID_OTP',
  OTP_EXPIRED:           'OTP_EXPIRED',
  OTP_MAX_ATTEMPTS:      'OTP_MAX_ATTEMPTS',
  OTP_RATE_LIMITED:      'OTP_RATE_LIMITED',

  // Validation
  VALIDATION_ERROR:      'VALIDATION_ERROR',
  NOT_FOUND:             'NOT_FOUND',
  CONFLICT:              'CONFLICT',

  // Orders
  INVALID_TRANSITION:    'INVALID_TRANSITION',
  SLOT_UNAVAILABLE:      'SLOT_UNAVAILABLE',
  STORE_NOT_FOUND:       'STORE_NOT_FOUND',
  ORDER_NOT_FOUND:       'ORDER_NOT_FOUND',
  ROUTING_FAILED:        'ROUTING_FAILED',

  // Payments
  PAYMENT_FAILED:        'PAYMENT_FAILED',
  PAYMENT_REQUIRED:      'PAYMENT_REQUIRED',
  WEBHOOK_SIGNATURE_INVALID: 'WEBHOOK_SIGNATURE_INVALID',

  // Coupons
  COUPON_NOT_FOUND:      'COUPON_NOT_FOUND',
  COUPON_EXPIRED:        'COUPON_EXPIRED',
  COUPON_USAGE_EXCEEDED: 'COUPON_USAGE_EXCEEDED',
  COUPON_MIN_ORDER:      'COUPON_MIN_ORDER',

  // Generic
  INTERNAL_ERROR:        'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE:   'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCodeKey = keyof typeof ErrorCode;

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  // Factory helpers
  static notFound(resource: string, id?: string): AppError {
    return new AppError(
      404,
      ErrorCode.NOT_FOUND,
      id ? `${resource} "${id}" not found.` : `${resource} not found.`,
    );
  }

  static unauthorized(message = 'Authentication required.'): AppError {
    return new AppError(401, ErrorCode.UNAUTHORIZED, message);
  }

  static forbidden(message = 'You do not have permission to perform this action.'): AppError {
    return new AppError(403, ErrorCode.FORBIDDEN, message);
  }

  static conflict(message: string): AppError {
    return new AppError(409, ErrorCode.CONFLICT, message);
  }

  static validation(message: string, details?: unknown): AppError {
    return new AppError(422, ErrorCode.VALIDATION_ERROR, message, details);
  }

  static internal(message = 'An unexpected error occurred.'): AppError {
    return new AppError(500, ErrorCode.INTERNAL_ERROR, message, undefined, false);
  }
}
