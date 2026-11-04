import { z } from 'zod';

export const productImageInputSchema = z.union([
  z
    .string()
    .url('Image must be a valid URL')
    .transform((url, ctx) => ({
      url,
      sortOrder: 0,
    })),
  z
    .object({
      url: z.string().url('Image must be a valid URL'),
      sortOrder: z.number().int().default(0).optional(),
    })
    .transform((item) => ({
      url: item.url,
      sortOrder: item.sortOrder ?? 0,
    })),
]);

export const createProductSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
  description: z.string().trim().min(1, 'Description is required'),
  priceCents: z.number().int('Price must be an integer').min(0, 'Price cannot be negative'),
  currency: z.string().trim().length(3, 'Currency must be 3 characters').default('USD').optional(),
  stock: z.number().int('Stock must be an integer').min(0, 'Stock cannot be negative').default(0).optional(),
  categoryId: z.string().uuid('Category ID must be a valid UUID'),
  sku: z.string().trim().min(1, 'SKU is required').max(100, 'SKU cannot exceed 100 characters'),
  status: z.enum(['DRAFT', 'ACTIVE']).default('DRAFT').optional(),
  images: z.array(productImageInputSchema).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z
  .object({
    title: z.string().trim().min(1, 'Title cannot be empty').max(255).optional(),
    description: z.string().trim().min(1, 'Description cannot be empty').optional(),
    priceCents: z.number().int('Price must be an integer').min(0, 'Price cannot be negative').optional(),
    currency: z.string().trim().length(3).optional(),
    stock: z.number().int('Stock must be an integer').min(0, 'Stock cannot be negative').optional(),
    categoryId: z.string().uuid('Category ID must be a valid UUID').optional(),
    sku: z.string().trim().min(1, 'SKU cannot be empty').max(100).optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
    images: z.array(productImageInputSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const sellerProductIdParamSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
});

export type SellerProductIdParam = z.infer<typeof sellerProductIdParamSchema>;
