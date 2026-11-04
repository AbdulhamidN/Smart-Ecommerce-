import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { validateParams } from '../middleware/validate';
import { notificationIdParamSchema } from '../schemas/notificationSchema';

const router = Router();

router.get('/', NotificationController.getUserNotifications);
router.patch(
  '/:id/read',
  validateParams(notificationIdParamSchema),
  NotificationController.markAsRead
);

export default router;
