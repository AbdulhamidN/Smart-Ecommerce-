import prisma from '../lib/prisma';
import { ProductStatus, OrderStatus } from '@prisma/client';
import { AppError } from '../lib/errors';

export class RecommendationService {
  /**
   * Retrieves product recommendations based on SQL co-occurrence (frequently bought together).
   * Falls back to category-based matching when order co-occurrence is insufficient.
   */
  static async getRecommendations(productId: string) {
    // 1. Verify target product exists
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, categoryId: true },
    });

    if (!currentProduct) {
      throw new AppError('Product not found', 'PRODUCT_NOT_FOUND', 404);
    }

    // 2. Find order IDs containing this productId (excluding cancelled or refunded orders)
    const orderItemsWithProduct = await prisma.orderItem.findMany({
      where: {
        productId,
        order: {
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
        },
      },
      select: { orderId: true },
    });

    const orderIds = Array.from(new Set(orderItemsWithProduct.map((oi) => oi.orderId)));

    let coOccurringProductIds: string[] = [];

    if (orderIds.length > 0) {
      // Find other items in those orders, matching active products
      const coOccurringItems = await prisma.orderItem.findMany({
        where: {
          orderId: { in: orderIds },
          productId: { not: productId },
          product: { status: ProductStatus.ACTIVE },
        },
        select: { productId: true },
      });

      // Frequency map for co-occurrence ranking
      const frequencyMap = new Map<string, number>();
      for (const item of coOccurringItems) {
        frequencyMap.set(item.productId, (frequencyMap.get(item.productId) || 0) + 1);
      }

      coOccurringProductIds = Array.from(frequencyMap.entries())
        .sort((a, b) => b[1] - a[1]) // highest frequency first
        .slice(0, 4)
        .map(([id]) => id);
    }

    const selectedIds = [...coOccurringProductIds];

    // 3. Fallback: If fewer than 4 co-occurring recommendations, complement with category products
    if (selectedIds.length < 4) {
      const needed = 4 - selectedIds.length;
      const categoryFallbacks = await prisma.product.findMany({
        where: {
          categoryId: currentProduct.categoryId,
          status: ProductStatus.ACTIVE,
          id: { notIn: [productId, ...selectedIds] },
        },
        orderBy: [{ stock: 'desc' }, { createdAt: 'desc' }],
        take: needed,
        select: { id: true },
      });

      for (const p of categoryFallbacks) {
        selectedIds.push(p.id);
      }
    }

    // 4. Secondary fallback: If still fewer than 4, fill with active products
    if (selectedIds.length < 4) {
      const needed = 4 - selectedIds.length;
      const generalFallbacks = await prisma.product.findMany({
        where: {
          status: ProductStatus.ACTIVE,
          id: { notIn: [productId, ...selectedIds] },
        },
        orderBy: [{ stock: 'desc' }, { createdAt: 'desc' }],
        take: needed,
        select: { id: true },
      });

      for (const p of generalFallbacks) {
        selectedIds.push(p.id);
      }
    }

    if (selectedIds.length === 0) {
      return [];
    }

    // 5. Query full product details preserving the ranked order
    const products = await prisma.product.findMany({
      where: { id: { in: selectedIds } },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        seller: {
          select: { id: true, storeName: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, sortOrder: true },
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    return selectedIds.map((id) => productMap.get(id)).filter(Boolean);
  }
}
