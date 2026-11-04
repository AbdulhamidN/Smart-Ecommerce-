import { Router } from 'express';
import { CartController } from '../controllers/cartController';
import { validateBody, validateParams } from '../middleware/validate';
import {
  addToCartSchema,
  updateCartItemSchema,
  cartItemIdParamSchema,
} from '../schemas/cartSchema';

const router = Router();

router.get('/', CartController.getCart);
router.post('/', validateBody(addToCartSchema), CartController.addToCart);
router.patch('/:id', validateParams(cartItemIdParamSchema), validateBody(updateCartItemSchema), CartController.updateCartItem);
router.delete('/:id', validateParams(cartItemIdParamSchema), CartController.removeCartItem);

export default router;
