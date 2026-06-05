import type { Request, Response, NextFunction } from 'express';

const allowedSeverities = ['Low', 'Medium', 'High'];

export const validateReport = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { title, severity, description, reporter } = req.body;

  if (!title || title.trim().length < 3) {
    next({ status: 400, message: 'Title must be at least 3 characters long' });
    return;
  }

  if (!allowedSeverities.includes(severity)) {
    next({ status: 400, message: 'Severity must be Low, Medium, or High' });
    return;
  }

  if (!description || description.trim().length < 3) {
    next({ status: 400, message: 'Description must be at least 3 characters long' });
    return;
  }

  if (!reporter || reporter.trim().length < 2) {
    next({ status: 400, message: 'Reporter must be at least 2 characters long' });
    return;
  }

  next();
};
