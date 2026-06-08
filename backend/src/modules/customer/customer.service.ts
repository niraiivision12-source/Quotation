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

  static async getAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.customer.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }
}
