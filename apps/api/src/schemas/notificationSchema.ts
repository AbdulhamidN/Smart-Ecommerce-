import { z } from 'zod';

export const notificationIdParamSchema = z.object({
  id: z.string().uuid('Invalid notification ID format'),
});

export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;
