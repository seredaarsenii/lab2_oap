import type { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const status = err.status || 500;
  
  res.status(status).json({
    status: 'error',
    code: status,
    message: err.message || 'Internal Server Error',
    path: req.url,
    timestamp: new Date().toISOString()
  });
};