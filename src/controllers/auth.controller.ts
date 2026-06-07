import type { NextFunction, Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { badRequest } from '../utils/http-error.js';

class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body as { email?: unknown; password?: unknown };

      if (typeof email !== 'string' || typeof password !== 'string') {
        throw badRequest('email and password are required');
      }

      res.json(await authService.login(email, password));
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
