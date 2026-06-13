import { prisma } from "@/config/prisma";

import { AppError } from "@/utils/app-error";

import { TaskPriority, TaskStatus } from "@prisma/client";

export class TaskService {
  static async create(
    createdById: string,
    data: {
      title: string;
      description?: string;
      priority: TaskPriority;
      dueAt?: Date;
      assignedToId: string;
      leadId?: string;
      customerId?: string;
      projectId?: string;
    },
  ) {
    const assignedUser = await prisma.user.findUnique({
      where: {
        id: data.assignedToId,
      },
    });

    if (!assignedUser) {
      throw new AppError("Assigned user not found", 404);
    }

    return prisma.task.create({
      data: {
        ...data,
        createdById,
      },
    });
  }

  static async getAll(
    page: number,
    limit: number,
    filters: {
      status?: TaskStatus;
      priority?: TaskPriority;
      assignedToId?: string;
    },
  ) {
    const skip = (page - 1) * limit;

    const where = {
      ...(filters.status && {
        status: filters.status,
      }),

      ...(filters.priority && {
        priority: filters.priority,
      }),

      ...(filters.assignedToId && {
        assignedToId: filters.assignedToId,
      }),
    };

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,

        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },

          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.task.count({
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
    const task = await prisma.task.findUnique({
      where: { id },

      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },

        lead: true,

        customer: true,

        project: true,
      },
    });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    return task;
  }

  static async update(
    id: string,
    data: {
      title?: string;
      description?: string | null;

      priority?: TaskPriority;

      status?: TaskStatus;

      dueAt?: Date;

      assignedToId?: string;

      leadId?: string | null;

      customerId?: string | null;

      projectId?: string | null;
    },
  ) {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    return prisma.task.update({
      where: { id },

      data,
    });
  }

  static async complete(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    return prisma.task.update({
      where: { id },

      data: {
        status: TaskStatus.COMPLETED,

        completedAt: new Date(),
      },
    });
  }

  static async cancel(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    return prisma.task.update({
      where: { id },

      data: {
        status: TaskStatus.CANCELLED,
      },
    });
  }
}
