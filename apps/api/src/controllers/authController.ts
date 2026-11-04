import { Request, Response, NextFunction } from 'express';
import {
  AuthService,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from '../services/authService';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, accessToken, refreshToken } = await AuthService.register(req.body);

      // Set httpOnly cookies
      res.cookie(ACCESS_TOKEN_COOKIE, accessToken, getAccessTokenCookieOptions());
      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, getRefreshTokenCookieOptions());

      return res.status(201).json({
        data: {
          user,
        },
      });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'EMAIL_ALREADY_EXISTS') {
        return res.status(409).json({
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: error.message || 'An account with this email already exists',
          },
        });
      }
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await AuthService.login(email, password);

      // Set httpOnly cookies
      res.cookie(ACCESS_TOKEN_COOKIE, accessToken, getAccessTokenCookieOptions());
      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, getRefreshTokenCookieOptions());

      return res.status(200).json({
        data: {
          user,
        },
      });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'INVALID_CREDENTIALS') {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: error.message || 'Invalid email or password',
          },
        });
      }
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.[REFRESH_TOKEN_COOKIE];

      if (!token) {
        return res.status(401).json({
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Refresh token cookie is missing',
          },
        });
      }

      const { user, accessToken, refreshToken } = await AuthService.rotateRefreshToken(token);

      res.cookie(ACCESS_TOKEN_COOKIE, accessToken, getAccessTokenCookieOptions());
      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, getRefreshTokenCookieOptions());

      return res.status(200).json({
        data: {
          user,
        },
      });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'INVALID_REFRESH_TOKEN') {
        return res.status(401).json({
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: error.message || 'Invalid or expired refresh token',
          },
        });
      }
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.[REFRESH_TOKEN_COOKIE];

      if (token) {
        await AuthService.logout(token);
      }

      res.clearCookie(ACCESS_TOKEN_COOKIE, {
        ...getAccessTokenCookieOptions(),
        maxAge: 0,
      });
      res.clearCookie(REFRESH_TOKEN_COOKIE, {
        ...getRefreshTokenCookieOptions(),
        maxAge: 0,
      });

      return res.status(200).json({
        data: {
          message: 'Logged out successfully',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const user = await AuthService.getMe(req.user.id);

      return res.status(200).json({
        data: {
          user,
        },
      });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'USER_NOT_FOUND') {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: error.message || 'User not found',
          },
        });
      }
      next(err);
    }
  }
}

export default AuthController;
