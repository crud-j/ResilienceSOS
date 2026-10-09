import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_ERROR';

  if (statusCode >= 500) {
    logger.error({ err, path: req.path }, 'Unhandled error');
  }

  res.status(statusCode).json({
    error: { code, message: err.message || 'An unexpected error occurred' },
  });
}

export function createError(statusCode: number, code: string, message: string): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}
