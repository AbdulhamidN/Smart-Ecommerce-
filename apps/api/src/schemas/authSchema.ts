import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    name: z.string().min(1, 'Name is required').trim(),
    role: z.enum(['CUSTOMER', 'SELLER']).optional().default('CUSTOMER'),
    storeName: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.role === 'SELLER' && (!data.storeName || data.storeName.trim() === '')) {
        return false;
      }
      return true;
    },
    {
      message: 'storeName is required when registering as a seller',
      path: ['storeName'],
    }
  );

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
