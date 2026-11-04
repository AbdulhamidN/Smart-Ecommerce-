import { OrderStatus, PaymentStatus, ProductStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError } from '../lib/errors';
import { CheckoutInput } from '../schemas/cartSchema';

export class CheckoutService {
  static async createOrder(
    userId: string,
    shippingAddress: CheckoutInput,
    idempotencyKey: string
  ) {
    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      throw new AppError('Idempotency-Key header is required for checkout', 'MISSING_IDEMPOTENCY_KEY', 400);
    }

    // 1. Idempotency Check: Return existing order if already created with this key
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                sku: true,
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

    if (existingOrder) {
      return existingOrder;
    }

    // 2. Critical Transaction: Stock decrement, Order creation, Payment, and Cart clearing
    return prisma.$transaction(
      async (tx) => {
        // a. Read user's cart items
        const cartItems = await tx.cartItem.findMany({
          where: { userId },
          include: {
            product: true,
          },
        });

      if (cartItems.length === 0) {
        throw new AppError('Cannot checkout with an empty cart', 'EMPTY_CART', 400);
      }

      // b. Decrement stock atomically with condition stock >= quantity
      for (const item of cartItems) {
        const result = await tx.product.updateMany({
          where: {
            id: item.productId,
            status: ProductStatus.ACTIVE,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        // c. If count is 0, stock is insufficient or product inactive -> Roll back transaction
        if (result.count === 0) {
          throw new AppError(
            `Product "${item.product.title}" has insufficient stock available (requested ${item.quantity}).`,
            'OUT_OF_STOCK',
            400
          );
        }
      }

      // Compute order total in integer cents
      const totalCents = cartItems.reduce(
        (sum, item) => sum + item.quantity * item.product.priceCents,
        0
      );

      // d. Create Order, OrderItems, Payment, and Status History
      const order = await tx.order.create({
        data: {
          customerId: userId,
          status: OrderStatus.PAID,
          totalCents,
          currency: 'USD',
          idempotencyKey,
          shippingName: shippingAddress.shippingName,
          shippingLine1: shippingAddress.shippingLine1,
          shippingCity: shippingAddress.shippingCity,
          shippingCountry: shippingAddress.shippingCountry,
          paidAt: new Date(),
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              sellerId: item.product.sellerId,
              quantity: item.quantity,
              unitPriceCents: item.product.priceCents,
            })),
          },
          payment: {
            create: {
              provider: 'MOCK',
              providerRef: `mock_pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              amountCents: totalCents,
              currency: 'USD',
              status: PaymentStatus.COMPLETED,
            },
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: OrderStatus.PAID,
              changedByUserId: userId,
            },
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  sku: true,
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

      // Create Notification for the customer
      await tx.notification.create({
        data: {
          userId,
          type: 'ORDER_PLACED',
          payload: {
            orderId: order.id,
            totalCents: order.totalCents,
            itemCount: cartItems.length,
          },
        },
      });

        // e. Clear the user's cart
        await tx.cartItem.deleteMany({
          where: { userId },
        });

        return order;
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );
  }

  static async getUserOrders(userId: string) {
    return prisma.order.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                sku: true,
                images: {
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
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

  static async getOrderById(userId: string, orderId: string, userRole?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
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
          include: {
            changedByUser: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 'ORDER_NOT_FOUND', 404);
    }

    // Customer can only view their own order; Admins can view any
    if (userRole !== 'ADMIN' && order.customerId !== userId) {
      throw new AppError('Forbidden: You do not have access to this order', 'FORBIDDEN', 403);
    }

    return order;
  }
}

export default CheckoutService;
