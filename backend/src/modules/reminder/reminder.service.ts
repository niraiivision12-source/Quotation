import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";
import {
  Prisma,
  ReminderPriority,
  ReminderRepeatType,
  ReminderStatus,
  ReminderType,
} from "@prisma/client";

async function updateLeadNextFollowUp(tx: Prisma.TransactionClient, leadId: string) {
  const nextReminder = await tx.reminder.findFirst({
    where: {
      leadId,
      status: ReminderStatus.PENDING,
    },
    orderBy: {
      dueAt: "asc",
    },
  });

  await tx.lead.update({
    where: { id: leadId },
    data: {
      nextFollowUpAt: nextReminder ? nextReminder.dueAt : null,
    },
  });
}

export class ReminderService {
  static async create(
    userId: string,
    data: {
      title: string;
      description?: string;
      type: ReminderType;
      priority: ReminderPriority;
      dueAt: Date;
      repeatType?: ReminderRepeatType;
      leadId?: string;
      customerId?: string;
      projectId?: string;
      paymentId?: string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const reminder = await tx.reminder.create({
        data: {
          ...data,
          userId,
        },
      });

      if (data.leadId) {
        await updateLeadNextFollowUp(tx, data.leadId);

        await tx.leadActivity.create({
          data: {
            leadId: data.leadId,
            userId,
            type: "REMINDER_CREATED",
            message: `Reminder created: ${reminder.title}`,
          },
        });
      }

      if (data.projectId) {
        await tx.projectActivity.create({
          data: {
            projectId: data.projectId,
            userId,
            type: "REMINDER_CREATED",
            message: `Reminder created: ${reminder.title}`,
          },
        });
      }

      return reminder;
    });
  }

  static async getMyReminders(
    userId: string,
    userRole: string,
    page: number,
    limit: number,
    projectId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.ReminderWhereInput = {};
    if (userRole !== "OWNER") {
      where.userId = userId;
    }
    if (projectId) {
      where.projectId = projectId;
    }

    const [items, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
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
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          project: {
            select: {
              id: true,
              projectName: true,
            },
          },
          payment: {
            select: {
              id: true,
              billNumber: true,
              project: {
                select: {
                  projectName: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.reminder.count({
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

  static async getById(id: string, userId: string, userRole: string) {
    const where = userRole === "OWNER" ? { id } : { id, userId };
    const reminder = await prisma.reminder.findFirst({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            projectName: true,
          },
        },
        payment: {
          select: {
            id: true,
            billNumber: true,
            project: {
              select: {
                projectName: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
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
    userRole: string,
    data: {
      title?: string;
      description?: string | null;
      priority?: ReminderPriority;
      dueAt?: Date;
      repeatType?: ReminderRepeatType;
      status?: ReminderStatus;
      leadId?: string | null;
      customerId?: string | null;
      projectId?: string | null;
      paymentId?: string | null;
    },
  ) {
    const where = userRole === "OWNER" ? { id } : { id, userId };
    const reminder = await prisma.reminder.findFirst({
      where,
    });

    if (!reminder) {
      throw new AppError("Reminder not found", 404);
    }

    return prisma.$transaction(async (tx) => {
      const updatedReminder = await tx.reminder.update({
        where: { id },
        data,
      });

      if (reminder.leadId) {
        await updateLeadNextFollowUp(tx, reminder.leadId);
      }

      return updatedReminder;
    });
  }

  static async complete(id: string, userId: string, userRole: string) {
    const where = userRole === "OWNER" ? { id } : { id, userId };
    const reminder = await prisma.reminder.findFirst({
      where,
    });

    if (!reminder) {
      throw new AppError("Reminder not found", 404);
    }

    return prisma.$transaction(async (tx) => {
      const updatedReminder = await tx.reminder.update({
        where: { id },
        data: {
          status: ReminderStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      if (reminder.leadId) {
        await updateLeadNextFollowUp(tx, reminder.leadId);

        await tx.leadActivity.create({
          data: {
            leadId: reminder.leadId,
            userId,
            type: "REMINDER_COMPLETED",
            message: `Reminder completed: ${reminder.title}`,
          },
        });
      }

      if (reminder.projectId) {
        await tx.projectActivity.create({
          data: {
            projectId: reminder.projectId,
            userId,
            type: "REMINDER_COMPLETED",
            message: `Reminder completed: ${reminder.title}`,
          },
        });
      }

      return updatedReminder;
    });
  }

  static async delete(id: string, userId: string, userRole: string) {
    const where = userRole === "OWNER" ? { id } : { id, userId };
    const reminder = await prisma.reminder.findFirst({
      where,
    });

    if (!reminder) {
      throw new AppError("Reminder not found", 404);
    }

    return prisma.$transaction(async (tx) => {
      await tx.reminder.delete({
        where: { id },
      });

      if (reminder.leadId) {
        await updateLeadNextFollowUp(tx, reminder.leadId);
      }

      return true;
    });
  }
}
