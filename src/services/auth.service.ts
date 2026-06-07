import {
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual
} from 'node:crypto';
import { userRepository } from '../repositories/user.repository.js';
import { HttpError, unauthorized } from '../utils/http-error.js';

const TOKEN_TTL_SECONDS = 60 * 60;
const tokenSecret = process.env.AUTH_TOKEN_SECRET ?? 'lab4-development-secret-change-me';

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
}

interface TokenPayload extends AuthenticatedUser {
  exp: number;
}

class AuthService {
  async login(email: string, password: string) {
    const user = await userRepository.findByEmailWithPassword(email);

    if (!user || !verifyPassword(password, user.password_hash)) {
      throw unauthorized('Invalid email or password');
    }

    const currentUser: AuthenticatedUser = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    return {
      token: createToken(currentUser),
      expiresIn: TOKEN_TTL_SECONDS,
      user: currentUser
    };
  }

  verifyToken(token: string): AuthenticatedUser {
    const [encodedPayload, providedSignature] = token.split('.');

    if (!encodedPayload || !providedSignature) {
      throw unauthorized('Invalid authentication token');
    }

    const expectedSignature = sign(encodedPayload);
    if (!safeEqual(providedSignature, expectedSignature)) {
      throw unauthorized('Invalid authentication token');
    }

    try {
      const payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8')
      ) as TokenPayload;

      if (!Number.isInteger(payload.id) || payload.exp <= Math.floor(Date.now() / 1000)) {
        throw unauthorized('Authentication token has expired');
      }

      return {
        id: payload.id,
        username: payload.username,
        email: payload.email
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw unauthorized('Invalid authentication token');
    }
  }
}

export function hashPassword(password: string) {
  const iterations = 120_000;
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationsText, salt, expectedHash] = storedHash.split('$');
  const iterations = Number(iterationsText);

  if (algorithm !== 'pbkdf2' || !salt || !expectedHash || !Number.isInteger(iterations)) {
    return false;
  }

  const actualHash = pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
  return safeEqual(actualHash, expectedHash);
}

function createToken(user: AuthenticatedUser) {
  const payload: TokenPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function sign(value: string) {
  return createHmac('sha256', tokenSecret).update(value).digest('base64url');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export const authService = new AuthService();
