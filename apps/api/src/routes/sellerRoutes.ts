import { Router } from 'express';
import { SellerProductController } from '../controllers/sellerProductController';
import { SellerAnalyticsController } from '../controllers/sellerAnalyticsController';
import { validateBody, validateParams } from '../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
  sellerProductIdParamSchema,
} from '../schemas/sellerProductSchema';

const router = Router();

router.get('/analytics', SellerAnalyticsController.getStats);
router.get('/products', SellerProductController.getProducts);
router.post('/products', validateBody(createProductSchema), SellerProductController.createProduct);
router.patch(
  '/products/:id',
  validateParams(sellerProductIdParamSchema),
  validateBody(updateProductSchema),
  SellerProductController.updateProduct
);
router.delete(
  '/products/:id',
  validateParams(sellerProductIdParamSchema),
  SellerProductController.archiveProduct
);

export default router;
