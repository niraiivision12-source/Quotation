import { prisma } from "@/config/prisma";

export class ReminderService {
  static async create(data: any) {
    return prisma.reminder.create({
      data,
    });
  }

  static async getMyReminders(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.reminder.findMany({
        where: {
          userId,
        },
        skip,
        take: limit,
        orderBy: {
          dueAt: "asc",
        },
      }),
      prisma.reminder.count({
        where: {
          userId,
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

  static async getOverdue(userId: string) {
    return prisma.reminder.findMany({
      where: {
        userId,
        status: "PENDING",
        dueAt: {
          lt: new Date(),
        },
      },
      orderBy: {
        dueAt: "asc",
      },
    });
  }
}
