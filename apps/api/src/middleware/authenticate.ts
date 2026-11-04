import { Request, Response, NextFunction } from 'express';
import { AuthService, ACCESS_TOKEN_COOKIE, TokenPayload } from '../services/authService';
import prisma from '../lib/prisma';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  seller?: {
    id: string;
    storeName: string;
    status: string;
  } | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // 1. Check cookies first
    if (req.cookies && req.cookies[ACCESS_TOKEN_COOKIE]) {
      token = req.cookies[ACCESS_TOKEN_COOKIE];
    }
    // 2. Check Authorization Bearer header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required: no access token provided',
        },
      });
    }

    let payload: TokenPayload;
    try {
      payload = AuthService.verifyAccessToken(token);
    } catch {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token',
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { seller: true },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User belonging to this token no longer exists',
        },
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      seller: user.seller
        ? {
            id: user.seller.id,
            storeName: user.seller.storeName,
            status: user.seller.status,
          }
        : null,
    };

    next();
  } catch (error) {
    next(error);
  }
};
