import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";

import { LifecycleStatus, ProjectPhase } from "@prisma/client";

export class ProjectService {
  static async create(data: {
    customerId: string;
    projectName: string;
    location?: string;
    assignedToId?: string;
    estimatedBudget?: number;
  }) {
    const customer = await prisma.customer.findUnique({
      where: {
        id: data.customerId,
      },
    });

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    const project = await prisma.project.create({
      data: {
        customerId: data.customerId,
        projectName: data.projectName,
        location: data.location,
        assignedToId: data.assignedToId,
        estimatedBudget: data.estimatedBudget,
      },
    });

    await prisma.projectPhaseTracking.createMany({
      data: [
        {
          projectId: project.id,
          phase: ProjectPhase.PIPES,
          status: LifecycleStatus.NOT_STARTED,
        },
        {
          projectId: project.id,
          phase: ProjectPhase.WIRING,
          status: LifecycleStatus.NOT_STARTED,
        },
        {
          projectId: project.id,
          phase: ProjectPhase.SWITCHES,
          status: LifecycleStatus.NOT_STARTED,
        },
        {
          projectId: project.id,
          phase: ProjectPhase.LIGHTS,
          status: LifecycleStatus.NOT_STARTED,
        },
        {
          projectId: project.id,
          phase: ProjectPhase.FANS,
          status: LifecycleStatus.NOT_STARTED,
        },
      ],
    });

    return project;
  }

  static async getAll(
    page: number,
    limit: number,
    search?: string,
    customerId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,

      ...(search && {
        projectName: {
          contains: search,
          mode: "insensitive" as const,
        },
      }),

      ...(customerId && {
        customerId,
      }),
    };

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          quotations: {
            select: { totalAmount: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.project.count({
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
    const project = await prisma.project.findUnique({
      where: {
        id,
        isActive: true,
      },
      include: {
        customer: true,
        phaseTracking: {
          orderBy: { createdAt: "asc" },
        },
        quotations: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            quotationNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
        reminders: {
          where: { status: "PENDING" },
          orderBy: { dueAt: "asc" },
          take: 1,
          select: {
            id: true,
            title: true,
            dueAt: true,
            priority: true,
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 4,
          select: {
            id: true,
            type: true,
            message: true,
            createdAt: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    return project;
  }

  static async update(
    id: string,
    data: {
      projectName?: string;
      location?: string | null;
      assignedToId?: string | null;
      estimatedBudget?: number;
      isCompleted?: boolean;
    },
  ) {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    return prisma.project.update({
      where: { id },
      data,
    });
  }

  static async deactivate(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    return prisma.project.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}
