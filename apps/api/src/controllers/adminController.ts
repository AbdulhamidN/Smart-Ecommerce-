import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService';
import { AppError } from '../lib/errors';
import { UpdateSellerStatusInput } from '../schemas/adminSchema';

export class AdminController {
  static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getAdminStats();
      return res.status(200).json({
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPendingSellers(_req: Request, res: Response, next: NextFunction) {
    try {
      const pendingSellers = await AdminService.getPendingSellers();
      return res.status(200).json({
        data: pendingSellers,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateSellerStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body as UpdateSellerStatusInput;

      const updatedSeller = await AdminService.updateSellerStatus(id, status);
      return res.status(200).json({
        data: updatedSeller,
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

  static async getAllOrders(_req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await AdminService.getAllOrders();
      return res.status(200).json({
        data: orders,
      });
    } catch (err) {
      next(err);
    }
  }
}
