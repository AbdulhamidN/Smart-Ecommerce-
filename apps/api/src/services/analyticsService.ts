import prisma from '../lib/prisma';
import { OrderStatus } from '@prisma/client';

export class AnalyticsService {
  /**
   * Returns analytics and performance metrics for a specific seller
   */
  static async getSellerStats(sellerId: string) {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        sellerId,
        order: {
          status: { not: OrderStatus.CANCELLED },
        },
      },
      include: {
        order: {
          select: {
            id: true,
            createdAt: true,
            status: true,
          },
        },
      },
    });

    let totalRevenueCents = 0;
    let totalUnitsSold = 0;
    const uniqueOrderIds = new Set<string>();
    const dateMap = new Map<string, { date: string; revenueCents: number; orderIds: Set<string> }>();

    for (const item of orderItems) {
      const itemRevenue = item.quantity * item.unitPriceCents;
      totalRevenueCents += itemRevenue;
      totalUnitsSold += item.quantity;
      uniqueOrderIds.add(item.orderId);

      const dateKey = item.order.createdAt.toISOString().slice(0, 10);
      let dayEntry = dateMap.get(dateKey);
      if (!dayEntry) {
        dayEntry = { date: dateKey, revenueCents: 0, orderIds: new Set<string>() };
        dateMap.set(dateKey, dayEntry);
      }
      dayEntry.revenueCents += itemRevenue;
      dayEntry.orderIds.add(item.orderId);
    }

    const revenueOverTime = Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((entry) => ({
        date: entry.date,
        revenueCents: entry.revenueCents,
        orderCount: entry.orderIds.size,
      }));

    return {
      totalRevenueCents,
      totalOrders: uniqueOrderIds.size,
      totalUnitsSold,
      revenueOverTime,
    };
  }
}
