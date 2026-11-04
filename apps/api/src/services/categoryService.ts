import prisma from '../lib/prisma';

export class CategoryService {
  static async getCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  }
}

export default CategoryService;
