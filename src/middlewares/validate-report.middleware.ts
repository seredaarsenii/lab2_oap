import type { Request, Response, NextFunction } from 'express';

export const validateReport = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const { title, severity, reporter } = req.body;

  if (!title || title.length < 3) {
    return res.status(400).json({
      code: 400,
      message: 'Invalid title'
    });
  }

  if (!severity) {
    return res.status(400).json({
      code: 400,
      message: 'Severity required'
    });
  }

  if (!reporter) {
    return res.status(400).json({
      code: 400,
      message: 'Reporter required'
    });
  }

  next();
};