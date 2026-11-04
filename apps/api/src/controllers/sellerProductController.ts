import { Request, Response, NextFunction } from 'express';
import { SellerProductService, AppError } from '../services/sellerProductService';
import { CreateProductInput, UpdateProductInput } from '../schemas/sellerProductSchema';

export class SellerProductController {
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.seller!.id;
      const products = await SellerProductService.getSellerProducts(sellerId);
      return res.status(200).json({
        data: products,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.seller!.id;
      const product = await SellerProductService.createProduct(sellerId, req.body as CreateProductInput);
      return res.status(201).json({
        data: product,
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

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.seller!.id;
      const { id } = req.params;
      const product = await SellerProductService.updateProduct(sellerId, id, req.body as UpdateProductInput);
      return res.status(200).json({
        data: product,
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

  static async archiveProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.seller!.id;
      const { id } = req.params;
      const product = await SellerProductService.archiveProduct(sellerId, id);
      return res.status(200).json({
        data: product,
        message: 'Product archived successfully',
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

export default SellerProductController;
