import type { NextFunction, Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { unauthorized } from '../utils/http-error.js';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authorization = req.get('Authorization');

    if (!authorization) {
      throw unauthorized('Authorization header is required');
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw unauthorized('Authorization must use the Bearer scheme');
    }

    req.currentUser = authService.verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
}
