import { prisma } from "@/config/prisma";

import { AppError } from "@/utils/app-error";

import { TaskPriority, TaskStatus, UserRole } from "@prisma/client";

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
      paymentId?: string;
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
      leadId?: string;
      customerId?: string;
      projectId?: string;
      paymentId?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
    userId: string,
    role: string,
  ) {
    const skip = (page - 1) * limit;

    const isOwner = role === UserRole.OWNER;
    const resolvedAssignedToId = isOwner ? filters.assignedToId : userId;

    const where = {
      ...(filters.status && {
        status: filters.status,
      }),

      ...(filters.priority && {
        priority: filters.priority,
      }),

      ...(resolvedAssignedToId && {
        assignedToId: resolvedAssignedToId,
      }),

      ...(filters.leadId && {
        leadId: filters.leadId,
      }),

      ...(filters.customerId && {
        customerId: filters.customerId,
      }),

      ...(filters.projectId && {
        projectId: filters.projectId,
      }),

      ...(filters.paymentId && {
        paymentId: filters.paymentId,
      }),

      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
    };

    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "desc";

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
        },

        orderBy: {
          [sortBy]: sortOrder,
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

      paymentId?: string | null;
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

  static async delete(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    return prisma.task.delete({
      where: { id },
    });
  }
}
