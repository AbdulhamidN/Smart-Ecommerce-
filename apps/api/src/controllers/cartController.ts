import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cartService';
import { AppError } from '../lib/errors';
import { AddToCartInput, UpdateCartItemInput } from '../schemas/cartSchema';

export class CartController {
  static async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const cart = await CartService.getCart(userId);
      return res.status(200).json({
        data: cart,
      });
    } catch (err) {
      next(err);
    }
  }

  static async addToCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { productId, quantity } = req.body as AddToCartInput;
      const item = await CartService.addToCart(userId, productId, quantity);
      return res.status(200).json({
        data: item,
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

  static async updateCartItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { quantity } = req.body as UpdateCartItemInput;
      const item = await CartService.updateCartItem(userId, id, quantity);
      return res.status(200).json({
        data: item,
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

  static async removeCartItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await CartService.removeCartItem(userId, id);
      return res.status(200).json({
        data: result,
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

export default CartController;
