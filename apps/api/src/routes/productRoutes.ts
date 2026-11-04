import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { validateQuery, validateParams } from '../middleware/validate';
import { productQuerySchema, productIdParamSchema } from '../schemas/productSchema';

const router = Router();

// 1. Specific static routes first
router.get('/categories', ProductController.getCategories);
router.get('/products', validateQuery(productQuerySchema), ProductController.getProducts);

// 2. Specific parameterized product routes
router.get(
  '/products/:id/recommendations',
  validateParams(productIdParamSchema),
  ProductController.getRecommendations
);
router.get('/products/:id', validateParams(productIdParamSchema), ProductController.getProductById);

export default router;
