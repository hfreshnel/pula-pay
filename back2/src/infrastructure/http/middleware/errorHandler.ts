import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../../../domain/errors/DomainError';
import { logger } from '../../../shared/utils/logger';
import { ApiResponse } from '../../../shared/types';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string || 'unknown';

  // Log error
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      requestId,
      path: req.path,
      method: req.method,
    },
    'Request error'
  );

  // Domain errors
  if (error instanceof DomainError) {
    const statusMap: Record<string, number> = {
      INSUFFICIENT_FUNDS: 400,
      WALLET_FROZEN: 403,
      WALLET_NOT_FOUND: 404,
      USER_NOT_FOUND: 404,
      TRANSACTION_NOT_FOUND: 404,
      INVALID_TRANSACTION_STATE: 409,
      LEDGER_IMBALANCE: 500,
    };

    res.status(statusMap[error.code] || 400).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.errors[0].message
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Generic errors
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
}
