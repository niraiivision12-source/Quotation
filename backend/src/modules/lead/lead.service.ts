import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";

export class LeadService {
  static async create(data: {
    name: string;
    mobile: string;
    email?: string;
    source?: string;
    notes?: string;
    assignedToId?: string;
  }) {
    const exists = await prisma.lead.findFirst({
      where: {
        mobile: data.mobile,
      },
    });

    if (exists) {
      throw new AppError("Lead already exists", 409);
    }

    return prisma.lead.create({
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
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.lead.count({
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
    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    return lead;
  }
}
