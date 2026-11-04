import { Request, Response, NextFunction } from 'express';
import { CheckoutService } from '../services/checkoutService';
import { OrderStateMachine } from '../services/orderStateMachine';
import { AppError } from '../lib/errors';
import { CheckoutInput, OrderStatusTransitionInput } from '../schemas/cartSchema';

export class OrderController {
  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const idempotencyKey = (req.headers['idempotency-key'] || req.headers['Idempotency-Key']) as string;

      if (!idempotencyKey) {
        return res.status(400).json({
          error: {
            code: 'MISSING_IDEMPOTENCY_KEY',
            message: 'Idempotency-Key header is required for placing orders',
          },
        });
      }

      const order = await CheckoutService.createOrder(
        userId,
        req.body as CheckoutInput,
        idempotencyKey
      );

      return res.status(201).json({
        data: order,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: {
            code: err.code,
            message: err.message,
          },
        });
      }
      next(err);
    }
  }

  static async getUserOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const orders = await CheckoutService.getUserOrders(userId);
      return res.status(200).json({
        data: orders,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const order = await CheckoutService.getOrderById(userId, id, req.user?.role);
      return res.status(200).json({
        data: order,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: {
            code: err.code,
            message: err.message,
          },
        });
      }
      next(err);
    }
  }

  static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { fromStatus, toStatus } = req.body as OrderStatusTransitionInput;

      const order = await OrderStateMachine.updateOrderStatus(id, fromStatus, toStatus, userId);
      return res.status(200).json({
        data: order,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: {
            code: err.code,
            message: err.message,
          },
        });
      }
      next(err);
    }
  }
}

export default OrderController;
