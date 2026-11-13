import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Role, User, Seller } from '@prisma/client';
import prisma from '../lib/prisma';
import { RegisterInput } from '../schemas/authSchema';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default_jwt_access_secret_change_in_production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret_change_in_production';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface UserResponse {
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

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

export const getAccessTokenCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
});

export const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

export class AuthService {
  static hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
  }

  static generateRefreshToken(payload: { userId: string }): string {
    const jti = crypto.randomUUID();
    return jwt.sign({ userId: payload.userId, jti }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
  }

  static verifyRefreshToken(token: string): { userId: string; jti: string } {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string; jti: string };
  }

  static async register(input: RegisterInput): Promise<{ user: UserResponse; accessToken: string; refreshToken: string }> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      const error = new Error('Email is already registered');
      (error as unknown as { code: string }).code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    const passwordHash = await this.hashPassword(input.password);
    const role = (input.role as Role) || Role.CUSTOMER;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash,
          role,
        },
      });

      let seller: Seller | null = null;
      if (role === Role.SELLER && input.storeName) {
        seller = await tx.seller.create({
          data: {
            userId: user.id,
            storeName: input.storeName,
          },
        });
      }

      return { user, seller };
    });

    const tokenPayload: TokenPayload = {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken({ userId: result.user.id });

    // Store hashed refresh token in DB
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        createdAt: result.user.createdAt,
        seller: result.seller
          ? {
              id: result.seller.id,
              storeName: result.seller.storeName,
              status: result.seller.status,
            }
          : null,
      },
      accessToken,
      refreshToken,
    };
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ user: UserResponse; accessToken: string; refreshToken: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { seller: true },
    });

    if (!user) {
      const error = new Error('Invalid email or password');
      (error as unknown as { code: string }).code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const isMatch = await this.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      (error as unknown as { code: string }).code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken({ userId: user.id });

    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      user: {
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
      },
      accessToken,
      refreshToken,
    };
  }

  static async rotateRefreshToken(
    oldRefreshToken: string
  ): Promise<{ user: UserResponse; accessToken: string; refreshToken: string }> {
    let payload: { userId: string; jti: string };
    try {
      payload = this.verifyRefreshToken(oldRefreshToken);
    } catch {
      const error = new Error('Invalid or expired refresh token');
      (error as unknown as { code: string }).code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    const oldTokenHash = this.hashToken(oldRefreshToken);
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        userId: payload.userId,
        tokenHash: oldTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: { seller: true },
        },
      },
    });

    if (!tokenRecord || !tokenRecord.user) {
      const error = new Error('Refresh token revoked or not found');
      (error as unknown as { code: string }).code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    const user = tokenRecord.user;
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = this.generateAccessToken(tokenPayload);
    const newRefreshToken = this.generateRefreshToken({ userId: user.id });

    const newTokenHash = this.hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt,
      },
    });

    return {
      user: {
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
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;

    try {
      const tokenHash = this.hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: {
          tokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    } catch {
      // Ignore logout database update errors
    }
  }

  static async getMe(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { seller: true },
    });

    if (!user) {
      const error = new Error('User not found');
      (error as unknown as { code: string }).code = 'USER_NOT_FOUND';
      throw error;
    }

    return {
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
  }
}

export default AuthService;

