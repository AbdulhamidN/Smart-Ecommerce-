import { OrderStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError } from '../lib/errors';

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

export class OrderStateMachine {
  static canTransition(from: OrderStatus, to: OrderStatus): boolean {
    const validNextStates = ALLOWED_TRANSITIONS[from];
    return Boolean(validNextStates && validNextStates.includes(to));
  }

  static async updateOrderStatus(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    userId: string
  ) {
    // 1. Verify that the requested transition is permitted by business rules
    if (!this.canTransition(fromStatus, toStatus)) {
      throw new AppError(
        `Invalid status transition from ${fromStatus} to ${toStatus}. CANCELLED is only permitted prior to SHIPPED.`,
        'INVALID_STATUS_TRANSITION',
        400
      );
    }

    // 2. Perform optimistic locking via updateMany with where: { id, status: fromStatus }
    return prisma.$transaction(
      async (tx) => {
        const updateResult = await tx.order.updateMany({
          where: {
            id: orderId,
            status: fromStatus,
          },
          data: {
            status: toStatus,
          },
        });

        // If count is not 1, another concurrent request already altered the status
        if (updateResult.count !== 1) {
          throw new AppError(
            `Conflict: Order ${orderId} is no longer in status ${fromStatus}. Concurrent update detected.`,
            'CONFLICT',
            409
          );
        }

        // Record in audit log
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            fromStatus,
            toStatus,
            changedByUserId: userId,
          },
        });

        // Return refreshed order
        return tx.order.findUnique({
          where: { id: orderId },
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, title: true, sku: true },
                },
              },
            },
            payment: true,
            statusHistory: {
              orderBy: { createdAt: 'asc' },
            },
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );
  }
}

export default OrderStateMachine;
