import prisma from '../lib/prisma';
import { AppError } from '../lib/errors';

export class NotificationService {
  /**
   * Returns all notifications for a specific user
   */
  static async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Marks a notification as read
   */
  static async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new AppError('Notification not found', 'NOTIFICATION_NOT_FOUND', 404);
    }

    if (notification.userId !== userId) {
      throw new AppError('Access denied', 'FORBIDDEN', 403);
    }

    if (notification.readAt) {
      return notification;
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }
}
