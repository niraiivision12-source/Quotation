import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";
import {
  ReminderPriority,
  ReminderRepeatType,
  ReminderStatus,
  ReminderType,
} from "@prisma/client";

export class ReminderService {
  static async create(
    userId: string,
    data: {
      title: string;
      description?: string;
      type: ReminderType;
      priority: ReminderPriority;
      dueAt: Date;
      leadId?: string;
      customerId?: string;
      projectId?: string;
    },
  ) {
    return prisma.reminder.create({
      data: {
        ...data,
        userId,
      },
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
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              mobile: true,
              email: true,
              city: true,
              source: true,
              notes: true,
              status: true,
              contactOwnerId: true,
              contactOwner: { select: { id: true, name: true } },
              referralDate: true,
              assignedToId: true,
              nextFollowUpAt: true,
              createdAt: true,
            },
          },
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

  static async getById(id: string, userId: string) {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!reminder) {
      throw new AppError("Reminder not found", 404);
    }

    return reminder;
  }

  static async update(
    id: string,
    userId: string,
    data: {
      title?: string;
      description?: string | null;
      priority?: ReminderPriority;
      dueAt?: Date;
      repeatType?: ReminderRepeatType;
    },
  ) {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!reminder) {
      throw new AppError("Reminder not found", 404);
    }

    return prisma.reminder.update({
      where: { id },
      data,
    });
  }

  static async complete(id: string, userId: string) {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!reminder) {
      throw new AppError("Reminder not found", 404);
    }

    return prisma.reminder.update({
      where: { id },
      data: {
        status: ReminderStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  static async delete(id: string, userId: string) {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!reminder) {
      throw new AppError("Reminder not found", 404);
    }

    await prisma.reminder.delete({
      where: { id },
    });

    return true;
  }
}
