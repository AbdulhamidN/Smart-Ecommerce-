import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { requireRole } from '../middleware/requireRole';
import { validateBody, validateParams } from '../middleware/validate';
import {
  checkoutSchema,
  orderIdParamSchema,
  orderStatusTransitionSchema,
} from '../schemas/cartSchema';
import { Role } from '@prisma/client';

const router = Router();

// Customer only order placement
router.post(
  '/',
  requireRole(Role.CUSTOMER),
  validateBody(checkoutSchema),
  OrderController.createOrder
);

// Order history & detail
router.get('/', OrderController.getUserOrders);
router.get('/:id', validateParams(orderIdParamSchema), OrderController.getOrderById);

// Order status state machine transitions
router.patch(
  '/:id/status',
  validateParams(orderIdParamSchema),
  validateBody(orderStatusTransitionSchema),
  OrderController.updateOrderStatus
);

export default router;
