import { z } from 'zod';

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().trim().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  inStock: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        const lower = val.toLowerCase().trim();
        if (lower === 'true' || lower === '1') return true;
        if (lower === 'false' || lower === '0') return false;
      }
      return val;
    }, z.boolean().optional())
    .optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest']).default('newest'),
  q: z.string().trim().optional(),
});

export type ProductQueryInput = z.infer<typeof productQuerySchema>;

export const productIdParamSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
});

export type ProductIdParam = z.infer<typeof productIdParamSchema>;
