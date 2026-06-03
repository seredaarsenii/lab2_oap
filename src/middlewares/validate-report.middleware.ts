import type { Request, Response, NextFunction } from 'express';
import { badRequest } from '../utils/http-error.js';

export const validateReport = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { title, severity, description, reporter } = req.body;
  const userId = req.body.userId ?? req.body.user_id;

  if (!userId) {
    return next(badRequest('userId is required', { field: 'userId' }));
  }

  if (!title || title.length < 3) {
    return next(badRequest('Invalid title', { field: 'title' }));
  }

  if (!severity) {
    return next(badRequest('Severity required', { field: 'severity' }));
  }

  if (!description) {
    return next(badRequest('Description required', { field: 'description' }));
  }

  if (!reporter) {
    return next(badRequest('Reporter required', { field: 'reporter' }));
  }

  next();
};
