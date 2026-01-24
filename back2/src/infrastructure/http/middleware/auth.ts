import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { ApiResponse } from '../../../shared/types';
import { config } from '../../../shared/config';

export interface JwtPayload {
  sub: string;
  email?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      },
      meta: {
        requestId: req.headers['x-request-id'] as string,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    if (!decoded.sub) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token missing subject claim',
        },
        meta: {
          requestId: req.headers['x-request-id'] as string,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    req.userId = decoded.sub;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        },
        meta: {
          requestId: req.headers['x-request-id'] as string,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    if (error instanceof JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
        meta: {
          requestId: req.headers['x-request-id'] as string,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication failed',
      },
      meta: {
        requestId: req.headers['x-request-id'] as string,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyRefreshToken(token: string): JwtPayload & { type: string } {
  const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload & { type: string };
  if (decoded.type !== 'refresh') {
    throw new JsonWebTokenError('Invalid token type');
  }
  return decoded;
}
