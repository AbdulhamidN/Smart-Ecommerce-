import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const addToCartSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1').default(1),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1'),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export const cartItemIdParamSchema = z.object({
  id: z.string().uuid('Invalid cart item ID format'),
});

export type CartItemIdParam = z.infer<typeof cartItemIdParamSchema>;

export const orderIdParamSchema = z.object({
  id: z.string().uuid('Invalid order ID format'),
});

export type OrderIdParam = z.infer<typeof orderIdParamSchema>;

export const checkoutSchema = z.object({
  shippingName: z.string().trim().min(1, 'Recipient name is required').max(255),
  shippingLine1: z.string().trim().min(1, 'Address line 1 is required').max(255),
  shippingCity: z.string().trim().min(1, 'City is required').max(100),
  shippingCountry: z.string().trim().min(1, 'Country is required').max(100),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const orderStatusTransitionSchema = z.object({
  fromStatus: z.nativeEnum(OrderStatus),
  toStatus: z.nativeEnum(OrderStatus),
});

export type OrderStatusTransitionInput = z.infer<typeof orderStatusTransitionSchema>;
