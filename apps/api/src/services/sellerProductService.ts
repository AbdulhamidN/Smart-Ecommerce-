import { ProductStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { CreateProductInput, UpdateProductInput } from '../schemas/sellerProductSchema';

export class AppError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class SellerProductService {
  static async getSellerProducts(sellerId: string) {
    return prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            url: true,
            sortOrder: true,
          },
        },
      },
    });
  }

  static async createProduct(sellerId: string, data: CreateProductInput) {
    // 1. Verify SKU uniqueness
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });
    if (existingSku) {
      throw new AppError('A product with this SKU already exists', 'SKU_ALREADY_EXISTS', 409);
    }

    // 2. Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      throw new AppError('Category not found', 'CATEGORY_NOT_FOUND', 400);
    }

    // 3. Create product with images
    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        sellerId,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        priceCents: data.priceCents,
        currency: data.currency || 'USD',
        stock: data.stock ?? 0,
        status: (data.status as ProductStatus) || ProductStatus.DRAFT,
        images:
          data.images && data.images.length > 0
            ? {
                create: data.images.map((img, idx) => ({
                  url: img.url,
                  sortOrder: img.sortOrder ?? idx,
                })),
              }
            : undefined,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            url: true,
            sortOrder: true,
          },
        },
      },
    });

    return product;
  }

  static async updateProduct(sellerId: string, productId: string, data: UpdateProductInput) {
    // 1. Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new AppError('Product not found', 'PRODUCT_NOT_FOUND', 404);
    }

    // 2. Verify ownership
    if (product.sellerId !== sellerId) {
      throw new AppError('Forbidden: You do not own this product', 'FORBIDDEN', 403);
    }

    // 3. If SKU is being updated, verify uniqueness
    if (data.sku && data.sku !== product.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (existingSku) {
        throw new AppError('A product with this SKU already exists', 'SKU_ALREADY_EXISTS', 409);
      }
    }

    // 4. If category is being updated, verify it exists
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new AppError('Category not found', 'CATEGORY_NOT_FOUND', 400);
      }
    }

    // 5. Update product and optionally replace images
    const updated = await prisma.$transaction(async (tx) => {
      if (data.images !== undefined) {
        await tx.productImage.deleteMany({
          where: { productId },
        });

        if (data.images.length > 0) {
          await tx.productImage.createMany({
            data: data.images.map((img, idx) => ({
              productId,
              url: img.url,
              sortOrder: img.sortOrder ?? idx,
            })),
          });
        }
      }

      return tx.product.update({
        where: { id: productId },
        data: {
          title: data.title,
          description: data.description,
          priceCents: data.priceCents,
          currency: data.currency,
          stock: data.stock,
          status: data.status ? (data.status as ProductStatus) : undefined,
          sku: data.sku,
          categoryId: data.categoryId,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              url: true,
              sortOrder: true,
            },
          },
        },
      });
    });

    return updated;
  }

  static async archiveProduct(sellerId: string, productId: string) {
    // 1. Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new AppError('Product not found', 'PRODUCT_NOT_FOUND', 404);
    }

    // 2. Verify ownership
    if (product.sellerId !== sellerId) {
      throw new AppError('Forbidden: You do not own this product', 'FORBIDDEN', 403);
    }

    // 3. Soft-delete by setting status to ARCHIVED
    const archived = await prisma.product.update({
      where: { id: productId },
      data: {
        status: ProductStatus.ARCHIVED,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            url: true,
            sortOrder: true,
          },
        },
      },
    });

    return archived;
  }
}

export default SellerProductService;
