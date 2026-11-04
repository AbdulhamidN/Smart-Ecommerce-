import { z } from 'zod';
import { SellerStatus } from '@prisma/client';

export const updateSellerStatusSchema = z.object({
  status: z.nativeEnum(SellerStatus, {
    errorMap: () => ({ message: 'Status must be one of: PENDING, APPROVED, REJECTED, SUSPENDED' }),
  }),
});

export type UpdateSellerStatusInput = z.infer<typeof updateSellerStatusSchema>;

export const sellerIdParamSchema = z.object({
  id: z.string().uuid('Invalid seller ID format'),
});

export type SellerIdParam = z.infer<typeof sellerIdParamSchema>;
