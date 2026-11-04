import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { CategoryService } from '../services/categoryService';
import { ProductQueryInput } from '../schemas/productSchema';

export class ProductController {
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ProductQueryInput;
      const result = await ProductService.getProducts(query);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id);
      return res.status(200).json({
        data: product,
      });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'PRODUCT_NOT_FOUND') {
        return res.status(404).json({
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        });
      }
      next(err);
    }
  }

  static async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryService.getCategories();
      return res.status(200).json({
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default ProductController;
