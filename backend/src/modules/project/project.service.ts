import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";

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

    return project;
  }

  static async getAll(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          projectName: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
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
      where: { id },
      include: {
        customer: true,
        phaseTracking: true,
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    return project;
  }
}
