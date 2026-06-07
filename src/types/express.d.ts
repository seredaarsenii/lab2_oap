import type { AuthenticatedUser } from '../services/auth.service.js';

declare global {
  namespace Express {
    interface Request {
      currentUser?: AuthenticatedUser;
    }
  }
}

export {};
