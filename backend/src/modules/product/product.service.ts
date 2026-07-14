import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";

export class ProductService {
  static async getAll(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,

          ...(search && {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                sku: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }),
        },
        skip,
        take: limit,
        orderBy: {
          name: "asc",
        },
      }),
      prisma.product.count({
        where: {
          isActive: true,

          ...(search && {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                sku: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }),
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  static async create(data: {
    sku: string;
    name: string;
    brand?: string;
    category?: string;
    unit?: string;
    costPrice?: number | null;
    mrp?: number | null;
    stockQty: number;
  }) {
    const exists = await prisma.product.findUnique({
      where: {
        sku: data.sku,
      },
    });

    if (exists) {
      throw new AppError("SKU already exists", 409);
    }

    return prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        brand: data.brand,
        category: data.category,
        unit: data.unit,
        costPrice: data.costPrice ?? null,
        mrp: data.mrp ?? null,
        stockQty: data.stockQty,
      },
    });
  }

  static async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: {
        id,
        isActive: true,
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  }

  static async update(
    id: string,
    data: {
      sku?: string;
      name?: string;
      brand?: string | null;
      category?: string | null;
      unit?: string | null;
      costPrice?: number | null;
      mrp?: number | null;
      stockQty?: number;
    },
  ) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return prisma.product.update({
      where: { id },
      data,
    });
  }

  static async deactivate(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return prisma.product.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}
