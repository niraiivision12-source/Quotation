import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";
import { formatMobile } from "@/utils/phone";

export class CustomerService {
  static async create(data: {
    name: string;
    mobile: string;
    email?: string;
    address?: string;
    assignedToId?: string;
  }) {
    const mobile = formatMobile(data.mobile);

    const exists = await prisma.customer.findUnique({
      where: { mobile },
    });

    if (exists) {
      throw new AppError("Customer already exists", 409);
    }

    return prisma.customer.create({
      data: { ...data, mobile },
    });
  }

  static async getAll(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          isActive: true,
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
      : { isActive: true };

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
      where: { id, isActive: true },
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

  static async update(
    id: string,
    data: {
      name?: string;
      mobile?: string;
      email?: string | null;
      address?: string | null;
      assignedToId?: string | null;
    },
  ) {
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    if (data.mobile && data.mobile !== customer.mobile) {
      const exists = await prisma.customer.findUnique({
        where: {
          mobile: data.mobile,
        },
      });

      if (exists) {
        throw new AppError("Mobile already exists", 409);
      }
    }

    return prisma.customer.update({
      where: { id },
      data,
    });
  }

  static async deactivate(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    return prisma.customer.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}
