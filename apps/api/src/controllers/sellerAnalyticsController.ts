import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { AppError } from '../lib/errors';

export class SellerAnalyticsController {
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user?.seller?.id;
      if (!sellerId) {
        throw new AppError('Seller account required', 'SELLER_REQUIRED', 403);
      }

      const stats = await AnalyticsService.getSellerStats(sellerId);
      return res.status(200).json({
        data: stats,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        });
      }
      next(err);
    }
  }
}
