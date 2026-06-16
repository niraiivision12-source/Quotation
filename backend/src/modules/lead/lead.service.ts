import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";
import { formatMobile } from "@/utils/phone";
import { LeadStatus, LifecycleStatus, ProjectPhase } from "@prisma/client";

export class LeadService {
  static async create(data: {
    name: string;
    mobile: string;
    email?: string;
    source?: string;
    notes?: string;
    assignedToId?: string;
    contactOwnerId?: string;
    city?: string;
    referralDate?: Date;
  }) {
    const mobile = formatMobile(data.mobile);

    const exists = await prisma.lead.findFirst({
      where: { mobile },
    });

    if (exists) {
      throw new AppError("Lead already exists", 409);
    }

    return prisma.lead.create({
      data: { ...data, mobile },
    });
  }

  static async getAll(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,

      ...(search && {
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
          contactOwner: { select: { id: true, name: true } },
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

      await tx.projectPhaseTracking.createMany({
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

      await tx.lead.update({
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
    });
  }

  static async update(
    id: string,
    data: {
      name?: string;
      mobile?: string;
      email?: string | null;
      source?: string | null;
      notes?: string | null;
      assignedToId?: string | null;
      status?: LeadStatus;
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

    return prisma.lead.update({
      where: { id },
      data,
    });
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
}
