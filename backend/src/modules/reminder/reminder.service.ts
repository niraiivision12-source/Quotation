import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import {
  Prisma,
  ReminderPriority,
  ReminderRepeatType,
  ReminderStatus,
  ReminderType,
} from "@prisma/client";
import { OpportunityService } from "../opportunity/opportunity.service";

async function updateOpportunityNextFollowUp(tx: Prisma.TransactionClient, opportunityId: string) {
  const nextReminder = await tx.reminder.findFirst({
    where: {
      opportunityId,
      status: ReminderStatus.PENDING,
    },
    orderBy: {
      dueAt: "asc",
    },
  });

  await tx.opportunity.update({
    where: { id: opportunityId },
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
      opportunityId?: string;
      customerId?: string;
      paymentId?: string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      if (data.opportunityId) {
        const opp = await tx.opportunity.findUnique({
          where: { id: data.opportunityId },
        });
        if (opp) {
          const user = await tx.user.findUnique({ where: { id: userId } });
          if (user && user.role !== "OWNER") {
            const settings = await tx.systemSettings.findUnique({ where: { id: "default" } });
            const mappings = (settings?.categorySalesmanAssignment as Record<string, any>) || {};
            const config = mappings[opp.category];
            let authorized = false;
            if (typeof config === "string") {
              authorized = config === userId;
            } else if (config && typeof config === "object") {
              const isPrimary = config.primarySalespersonId === userId;
              const isBackup = config.backupSalespersonId === userId;
              const isAdditional = Array.isArray(config.additionalEditors) && config.additionalEditors.includes(userId);
              authorized = isPrimary || isBackup || isAdditional;
            }
            if (opp.assignedToId === userId) {
              authorized = true;
            }
            if (!authorized) {
              throw new AppError("You do not have permission to manage reminders for this pipeline category", 403);
            }
          }
        }
      }

      const reminder = await tx.reminder.create({
        data: {
          ...data,
          userId,
        },
      });

      if (data.opportunityId) {
        await updateOpportunityNextFollowUp(tx, data.opportunityId);

        await tx.opportunityActivity.create({
          data: {
            opportunityId: data.opportunityId,
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
    opportunityId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.ReminderWhereInput = {};
    if (userRole !== "OWNER") {
      const assignedCats = await OpportunityService.getAssignedCategories(userId);
      where.OR = [
        { userId: userId },
        {
          opportunity: {
            OR: [
              { category: { in: assignedCats } },
              { assignedToId: userId },
            ],
          },
        },
      ];
    }
    if (opportunityId) {
      where.opportunityId = opportunityId;
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
          opportunity: {
            select: {
              id: true,
              category: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          payment: {
            select: {
              id: true,
              billNumber: true,
              opportunity: {
                select: {
                  category: true,
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
        opportunity: {
          select: {
            id: true,
            category: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        payment: {
          select: {
            id: true,
            billNumber: true,
            opportunity: {
              select: {
                category: true,
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
      opportunityId?: string | null;
      customerId?: string | null;
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

      if (reminder.opportunityId) {
        await updateOpportunityNextFollowUp(tx, reminder.opportunityId);
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

      if (reminder.opportunityId) {
        await updateOpportunityNextFollowUp(tx, reminder.opportunityId);

        await tx.opportunityActivity.create({
          data: {
            opportunityId: reminder.opportunityId,
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

      if (reminder.opportunityId) {
        await updateOpportunityNextFollowUp(tx, reminder.opportunityId);
      }

      return true;
    });
  }
}
