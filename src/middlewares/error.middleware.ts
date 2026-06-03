import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/http-error.js';

export const errorHandler = (
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const status = err instanceof HttpError ? err.status : err.status || 500;
  const message = err.message || 'Internal Server Error';
  const details = err instanceof HttpError ? err.details : err.details;
  
  res.status(status).json({
    code: status,
    message,
    details: details ?? null,
    path: req.url,
    timestamp: new Date().toISOString()
  });
};
