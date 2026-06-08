import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";
import { LeadStatus } from "@prisma/client";

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

  static async convert(
    leadId: string,
    data: {
      projectName: string;
      location?: string;
      estimatedBudget?: number;
    },
  ) {
    const lead = await prisma.lead.findUnique({
      where: {
        id: leadId,
      },
    });

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    const customer = await prisma.customer.create({
      data: {
        name: lead.name,
        mobile: lead.mobile,
        email: lead.email,
        assignedToId: lead.assignedToId,
      },
    });

    const project = await prisma.project.create({
      data: {
        customerId: customer.id,
        projectName: data.projectName,
        location: data.location,
        estimatedBudget: data.estimatedBudget,
        assignedToId: lead.assignedToId,
      },
    });

    await prisma.projectPhaseTracking.createMany({
      data: [
        {
          projectId: project.id,
          phase: "PIPES",
        },
        {
          projectId: project.id,
          phase: "WIRING",
        },
        {
          projectId: project.id,
          phase: "SWITCHES",
        },
        {
          projectId: project.id,
          phase: "LIGHTS",
        },
        {
          projectId: project.id,
          phase: "FANS",
        },
      ],
    });

    await prisma.lead.update({
      where: {
        id: lead.id,
      },
      data: {
        status: LeadStatus.WON,
        convertedAt: new Date(),
      },
    });

    return {
      customer,
      project,
    };
  }
}
