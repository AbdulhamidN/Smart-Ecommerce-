import { ProductStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError } from '../lib/errors';

export class CartService {
  static async getCart(userId: string) {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      orderBy: { product: { createdAt: 'desc' } },
      include: {
        product: {
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                url: true,
                sortOrder: true,
              },
            },
            seller: {
              select: {
                id: true,
                storeName: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    let totalCents = 0;
    let totalQuantity = 0;

    const items = cartItems.map((item) => {
      const subtotalCents = item.quantity * item.product.priceCents;
      totalCents += subtotalCents;
      totalQuantity += item.quantity;

      const isAvailable =
        item.product.status === ProductStatus.ACTIVE && item.product.stock >= item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        subtotalCents,
        isAvailable,
        product: item.product,
      };
    });

    return {
      items,
      totalCents,
      totalQuantity,
    };
  }

  static async addToCart(userId: string, productId: string, quantity: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.status !== ProductStatus.ACTIVE) {
      throw new AppError('Product not found or unavailable', 'PRODUCT_NOT_AVAILABLE', 404);
    }

    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    const targetQuantity = (existingCartItem ? existingCartItem.quantity : 0) + quantity;

    if (targetQuantity > product.stock) {
      throw new AppError(
        `Cannot add ${quantity} item(s). Available stock is ${product.stock} (already in cart: ${
          existingCartItem?.quantity || 0
        })`,
        'INSUFFICIENT_STOCK',
        400
      );
    }

    if (existingCartItem) {
      return prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: targetQuantity },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              seller: { select: { id: true, storeName: true } },
            },
          },
        },
      });
    }

    return prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity: targetQuantity,
      },
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            seller: { select: { id: true, storeName: true } },
          },
        },
      },
    });
  }

  static async updateCartItem(userId: string, cartItemId: string, quantity: number) {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: true },
    });

    if (!cartItem || cartItem.userId !== userId) {
      throw new AppError('Cart item not found', 'CART_ITEM_NOT_FOUND', 404);
    }

    if (cartItem.product.status !== ProductStatus.ACTIVE) {
      throw new AppError('Product is no longer active', 'PRODUCT_NOT_AVAILABLE', 400);
    }

    if (quantity > cartItem.product.stock) {
      throw new AppError(
        `Cannot set quantity to ${quantity}. Available stock is ${cartItem.product.stock}`,
        'INSUFFICIENT_STOCK',
        400
      );
    }

    return prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            seller: { select: { id: true, storeName: true } },
          },
        },
      },
    });
  }

  static async removeCartItem(userId: string, cartItemId: string) {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem || cartItem.userId !== userId) {
      throw new AppError('Cart item not found', 'CART_ITEM_NOT_FOUND', 404);
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return { id: cartItemId, success: true };
  }

  static async clearCart(userId: string) {
    await prisma.cartItem.deleteMany({
      where: { userId },
    });
    return { success: true };
  }
}

export default CartService;
