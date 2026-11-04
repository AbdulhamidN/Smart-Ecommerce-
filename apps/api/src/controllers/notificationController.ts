import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notificationService';
import { AppError } from '../lib/errors';

export class NotificationController {
  static async getUserNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const notifications = await NotificationService.getUserNotifications(userId);
      return res.status(200).json({
        data: notifications,
      });
    } catch (err) {
      next(err);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const notification = await NotificationService.markAsRead(userId, id);
      return res.status(200).json({
        data: notification,
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
