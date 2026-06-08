import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";

export class CustomerService {
  static async create(data: {
    name: string;
    mobile: string;
    email?: string;
    address?: string;
    assignedToId?: string;
  }) {
    const exists = await prisma.customer.findUnique({
      where: {
        mobile: data.mobile,
      },
    });

    if (exists) {
      throw new AppError("Customer already exists", 409);
    }

    return prisma.customer.create({
      data,
    });
  }

  static async getAll(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              mobile: {
                contains: search,
              },
            },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.customer.count({
        where,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  static async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        projects: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    return customer;
  }
}
