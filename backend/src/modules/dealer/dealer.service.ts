import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import type { CreateDealerDTO, UpdateDealerDTO } from "./dealer.types";

export class DealerService {
  static async create(data: CreateDealerDTO) {
    const exists = await prisma.dealer.findUnique({
      where: {
        mobile: data.mobile,
      },
    });

    if (exists) {
      throw new AppError("Dealer already exists with this mobile number", 409);
    }

    return prisma.dealer.create({
      data: {
        name: data.name,
        contactPerson: data.contactPerson || null,
        mobile: data.mobile,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        gst: data.gst || null,
      },
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
      prisma.dealer.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.dealer.count({
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
    const dealer = await prisma.dealer.findUnique({
      where: { id, isActive: true },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!dealer) {
      throw new AppError("Dealer not found", 404);
    }

    return dealer;
  }

  static async update(id: string, data: UpdateDealerDTO) {
    const dealer = await prisma.dealer.findUnique({
      where: { id },
    });

    if (!dealer) {
      throw new AppError("Dealer not found", 404);
    }

    if (data.mobile && data.mobile !== dealer.mobile) {
      const exists = await prisma.dealer.findUnique({
        where: {
          mobile: data.mobile,
        },
      });

      if (exists) {
        throw new AppError("Mobile already exists for another dealer", 409);
      }
    }

    return prisma.dealer.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        contactPerson: data.contactPerson === undefined ? undefined : data.contactPerson,
        mobile: data.mobile ?? undefined,
        email: data.email === undefined ? undefined : data.email,
        address: data.address === undefined ? undefined : data.address,
        gst: data.gst === undefined ? undefined : data.gst,
        city: data.city === undefined ? undefined : data.city,
        state: data.state === undefined ? undefined : data.state,
      },
    });
  }

  static async deactivate(id: string) {
    const dealer = await prisma.dealer.findUnique({
      where: { id },
    });

    if (!dealer) {
      throw new AppError("Dealer not found", 404);
    }

    return prisma.dealer.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}
