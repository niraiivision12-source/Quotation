import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";
import { LeadStatus, LifecycleStatus, ProjectPhase } from "@prisma/client";

export class LeadService {
  static async create(data: {
    name: string;
    mobile: string;
    email?: string;
    city?: string;
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

    return prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data,
      });

      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "CREATED",
          message: "Lead created",
        },
      });

      return lead;
    });
  }

  static async getAll(
    page: number,
    limit: number,
    search?: string,
    filters?: {
      source?: string;
      status?: string;
      assignedToId?: string;
      city?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(filters?.source && { source: filters.source }),
      ...(filters?.status && { status: filters.status as LeadStatus }),
      ...(filters?.assignedToId && { assignedToId: filters.assignedToId }),
      ...(filters?.city && {
        city: { contains: filters.city, mode: "insensitive" as const },
      }),
      ...((filters?.dateFrom || filters?.dateTo) && {
        createdAt: {
          ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
          ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
        },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { mobile: { contains: search } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
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
      where: {
        id,
        isActive: true,
      },
      include: {
        customer: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        activities: {
          orderBy: {
            createdAt: "desc",
          },
        },

        notesHistory: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },

        quotations: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
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

    if (lead.status === LeadStatus.WON) {
      throw new AppError("Lead already converted", 409);
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: {
        mobile: lead.mobile,
      },
    });

    if (existingCustomer) {
      throw new AppError(
        "Customer already exists with this mobile number",
        409,
      );
    }

    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          name: lead.name,
          mobile: lead.mobile,
          email: lead.email,
          assignedToId: lead.assignedToId,
          leadId: lead.id,
        },
      });

      await tx.customerActivity.create({
        data: {
          customerId: customer.id,
          type: "CREATED",
          message: "Customer created from lead conversion",
        },
      });

      const project = await tx.project.create({
        data: {
          customerId: customer.id,
          projectName: data.projectName,
          location: data.location,
          estimatedBudget: data.estimatedBudget,
          assignedToId: lead.assignedToId,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: project.id,
          type: "CREATED",
          message: "Project created from lead conversion",
        },
      });

      await tx.projectPhaseTracking.createMany({
        data: Object.values(ProjectPhase).map((phase) => ({
          projectId: project.id,
          phase,
          status: LifecycleStatus.NOT_STARTED,
        })),
      });

      await tx.lead.update({
        where: {
          id: lead.id,
        },
        data: {
          status: LeadStatus.WON,
          convertedAt: new Date(),
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "CONVERTED",
          message: "Lead converted to customer",
          metadata: {
            customerId: customer.id,
            projectId: project.id,
          },
        },
      });

      return {
        customer,
        project,
      };
    });
  }

  static async update(
    id: string,
    data: {
      name?: string;
      mobile?: string;
      email?: string | null;
      city?: string | null;
      source?: string | null;
      notes?: string | null;
      assignedToId?: string | null;
      status?: LeadStatus;
      nextFollowUpAt?: string | null;
    },
  ) {
    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    if (data.mobile && data.mobile !== lead.mobile) {
      const exists = await prisma.lead.findFirst({
        where: {
          mobile: data.mobile,
          NOT: {
            id,
          },
        },
      });

      if (exists) {
        throw new AppError("Mobile already exists", 409);
      }
    }

    const updateData = {
      ...data,

      nextFollowUpAt: data.nextFollowUpAt
        ? new Date(data.nextFollowUpAt)
        : data.nextFollowUpAt,
    };

    return prisma.$transaction(async (tx) => {
      const updatedLead = await tx.lead.update({
        where: { id },
        data: updateData,
      });

      // Status changed
      if (data.status && data.status !== lead.status) {
        await tx.leadActivity.create({
          data: {
            leadId: lead.id,
            type: "STATUS_CHANGED",
            message: `Status changed from ${lead.status} to ${data.status}`,
            metadata: {
              oldStatus: lead.status,
              newStatus: data.status,
            },
          },
        });
      }

      // Follow-up scheduled
      if (data.nextFollowUpAt) {
        await tx.leadActivity.create({
          data: {
            leadId: lead.id,
            type: "FOLLOW_UP_SET",
            message: `Follow-up scheduled for ${new Date(
              data.nextFollowUpAt,
            ).toLocaleString()}`,
          },
        });
      }

      // Reopen lead
      if (
        lead.status === LeadStatus.LOST &&
        data.status === LeadStatus.FOLLOW_UP
      ) {
        await tx.lead.update({
          where: {
            id,
          },
          data: {
            reopenedCount: {
              increment: 1,
            },
          },
        });

        await tx.leadActivity.create({
          data: {
            leadId: lead.id,
            type: "REOPENED",
            message: "Lead reopened",
          },
        });
      }

      return updatedLead;
    });
  }

  static async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, followUp, won, lost, todayFollowUp] = await Promise.all([
      prisma.lead.count({ where: { isActive: true } }),
      prisma.lead.count({ where: { isActive: true, status: "FOLLOW_UP" } }),
      prisma.lead.count({ where: { isActive: true, status: "WON" } }),
      prisma.lead.count({ where: { isActive: true, status: "LOST" } }),
      prisma.lead.count({
        where: {
          isActive: true,
          nextFollowUpAt: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    return { total, followUp, won, lost, todayFollowUp };
  }

  static async deactivate(id: string) {
    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    return prisma.lead.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  static async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, followUp, won, lost, todayFollowUp] = await Promise.all([
      prisma.lead.count({ where: { isActive: true } }),
      prisma.lead.count({ where: { isActive: true, status: "FOLLOW_UP" } }),
      prisma.lead.count({ where: { isActive: true, status: "WON" } }),
      prisma.lead.count({ where: { isActive: true, status: "LOST" } }),
      prisma.lead.count({
        where: {
          isActive: true,
          nextFollowUpAt: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    return { total, followUp, won, lost, todayFollowUp };
  }
}
