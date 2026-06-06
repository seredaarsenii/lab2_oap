import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/http-error.js';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const fallback = err as { status?: number; message?: string; details?: Record<string, unknown> };
  const status = err instanceof HttpError ? err.status : fallback.status ?? 500;
  const message = err instanceof HttpError
    ? err.message
    : status === 500
      ? 'Internal Server Error'
      : fallback.message ?? 'Request failed';
  const details = err instanceof HttpError ? err.details : fallback.details;
  
  res.status(status).json({
    code: status,
    message,
    details: details ?? null,
    path: req.url,
    timestamp: new Date().toISOString()
  });
};
