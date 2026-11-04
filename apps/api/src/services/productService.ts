import { Prisma, ProductStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { ProductQueryInput } from '../schemas/productSchema';

export class ProductService {
  static async getProducts(query: ProductQueryInput) {
    const { page, limit, category, minPrice, maxPrice, inStock, sort, q } = query;
    const skip = (page - 1) * limit;

    let matchedIds: string[] | null = null;

    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      const rawMatches = await prisma.$queryRaw<{ id: string }[]>(
        Prisma.sql`
          SELECT id FROM Product
          WHERE status = 'ACTIVE'
            AND MATCH(title, description) AGAINST(${searchTerm} IN NATURAL LANGUAGE MODE)
        `
      );
      matchedIds = rawMatches.map((r) => r.id);

      // If search query returned 0 matches, return early
      if (matchedIds.length === 0) {
        return {
          data: [],
          pagination: {
            total: 0,
            page,
            pages: 0,
          },
        };
      }
    }

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
    };

    if (matchedIds !== null) {
      where.id = { in: matchedIds };
    }

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.priceCents = {};
      if (minPrice !== undefined) {
        where.priceCents.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.priceCents.lte = maxPrice;
      }
    }

    if (inStock !== undefined) {
      if (inStock) {
        where.stock = { gt: 0 };
      } else {
        where.stock = { equals: 0 };
      }
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput;
    switch (sort) {
      case 'price_asc':
        orderBy = { priceCents: 'asc' };
        break;
      case 'price_desc':
        orderBy = { priceCents: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          seller: {
            select: {
              id: true,
              storeName: true,
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
      }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      data: products,
      pagination: {
        total,
        page,
        pages,
      },
    };
  }

  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        seller: {
          select: {
            id: true,
            storeName: true,
            status: true,
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

    if (!product || product.status !== ProductStatus.ACTIVE) {
      const error = new Error('Product not found');
      (error as unknown as { code: string }).code = 'PRODUCT_NOT_FOUND';
      throw error;
    }

    return product;
  }
}

export default ProductService;
