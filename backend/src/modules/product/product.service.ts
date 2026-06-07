import { prisma } from "@/config/prisma";

export class ProductService {
  static async getAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        orderBy: {
          name: "asc",
        },
      }),
      prisma.product.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }
}
