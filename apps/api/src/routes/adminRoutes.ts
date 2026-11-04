import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { validateBody, validateParams } from '../middleware/validate';
import { updateSellerStatusSchema, sellerIdParamSchema } from '../schemas/adminSchema';

const router = Router();

router.get('/stats', AdminController.getStats);
router.get('/sellers/pending', AdminController.getPendingSellers);
router.patch(
  '/sellers/:id/status',
  validateParams(sellerIdParamSchema),
  validateBody(updateSellerStatusSchema),
  AdminController.updateSellerStatus
);
router.get('/orders', AdminController.getAllOrders);

export default router;
