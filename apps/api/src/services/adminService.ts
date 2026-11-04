import prisma from '../lib/prisma';
import { AppError } from '../lib/errors';
import { SellerStatus, OrderStatus } from '@prisma/client';

export class AdminService {
  /**
   * Returns high-level platform analytics & metrics
   */
  static async getAdminStats() {
    const [totalUsers, totalSellers, pendingSellers, totalOrders, revenueAggregate] =
      await Promise.all([
        prisma.user.count(),
        prisma.seller.count(),
        prisma.seller.count({ where: { status: SellerStatus.PENDING } }),
        prisma.order.count(),
        prisma.order.aggregate({
          _sum: { totalCents: true },
          where: {
            status: { not: OrderStatus.CANCELLED },
          },
        }),
      ]);

    return {
      totalUsers,
      totalSellers,
      pendingSellers,
      totalOrders,
      totalRevenueCents: revenueAggregate._sum.totalCents ?? 0,
    };
  }

  /**
   * Returns all sellers pending administrative approval
   */
  static async getPendingSellers() {
    return prisma.seller.findMany({
      where: { status: SellerStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * Updates seller status (APPROVED, REJECTED, etc.) and creates a notification
   */
  static async updateSellerStatus(sellerId: string, status: SellerStatus) {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: { user: true },
    });

    if (!seller) {
      throw new AppError('Seller not found', 'SELLER_NOT_FOUND', 404);
    }

    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create a notification for the seller user
    await prisma.notification.create({
      data: {
        userId: seller.userId,
        type: 'SELLER_STATUS_UPDATED',
        payload: {
          sellerId: seller.id,
          storeName: seller.storeName,
          status,
          message: `Your seller application for store "${seller.storeName}" has been ${status.toLowerCase()}.`,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    return updatedSeller;
  }

  /**
   * Returns all orders across the platform with customer and item details
   */
  static async getAllOrders() {
    return prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                sku: true,
                images: {
                  take: 1,
                  orderBy: { sortOrder: 'asc' },
                  select: { url: true },
                },
              },
            },
            seller: {
              select: {
                id: true,
                storeName: true,
              },
            },
          },
        },
        payment: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }
}
