import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";
import { formatMobile } from "@/utils/phone";
import { LeadActivityType, LeadStatus, LifecycleStatus, ProjectPhase } from "@prisma/client";

async function logActivity(leadId: string, userId: string, type: LeadActivityType, message: string) {
  await prisma.leadActivity.create({ data: { leadId, userId, type, message } });
}

export class LeadService {
  static async create(
    userId: string,
    data: {
      name: string;
      mobile: string;
      email?: string;
      source?: string;
      notes?: string;
      assignedToId?: string;
      contactOwnerId?: string;
      city?: string;
      referralDate?: Date;
    },
  ) {
    const mobile = formatMobile(data.mobile);

    const exists = await prisma.lead.findFirst({
      where: { mobile, isActive: true },
    });

    if (exists) {
      throw new AppError("Lead already exists", 409);
    }

    const lead = await prisma.lead.create({ data: { ...data, mobile } });
    await logActivity(lead.id, userId, LeadActivityType.CREATED, `Lead created`);
    return lead;
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
    userId: string,
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

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        mobile: lead.mobile,
        isActive: true,
      },
    });

    if (existingCustomer) {
      throw new AppError(
        "Customer already exists with this mobile number",
        409,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Remove any stale inactive customer with this mobile (unique constraint block)
      const staleCustomer = await tx.customer.findUnique({
        where: { mobile: lead.mobile },
      });

      if (staleCustomer && !staleCustomer.isActive) {
        const staleProjects = await tx.project.findMany({
          where: { customerId: staleCustomer.id },
          select: { id: true },
        });
        const staleProjectIds = staleProjects.map((p) => p.id);

        if (staleProjectIds.length > 0) {
          await tx.quotation.deleteMany({
            where: { projectId: { in: staleProjectIds } },
          });
        }

        // customer delete cascades to projects → phase tracking
        await tx.customer.delete({ where: { id: staleCustomer.id } });
      }

      const customer = await tx.customer.create({
        data: {
          name: lead.name,
          mobile: lead.mobile,
          email: lead.email,
          assignedToId: lead.assignedToId,
          city: lead.city,
          source: lead.source,
          notes: lead.notes,
          referralDate: lead.referralDate,
          contactOwnerId: lead.contactOwnerId,
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

    await logActivity(leadId, userId, LeadActivityType.CONVERTED, `Lead converted to customer — project "${data.projectName}" created`);

    return result;
  }

  static async update(
    id: string,
    userId: string,
    data: {
      name?: string;
      mobile?: string;
      email?: string | null;
      city?: string | null;
      source?: string | null;
      notes?: string | null;
      referralDate?: Date | null;
      assignedToId?: string | null;
      contactOwnerId?: string | null;
      status?: LeadStatus;
      nextFollowUpAt?: Date | null;
    },
  ) {
    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead) throw new AppError("Lead not found", 404);

    if (data.mobile && data.mobile !== lead.mobile) {
      const exists = await prisma.lead.findFirst({
        where: { mobile: data.mobile, isActive: true, NOT: { id } },
      });
      if (exists) throw new AppError("Mobile already exists", 409);
    }

    const updatedLead = await prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({ where: { id }, data });

      const customer = await tx.customer.findUnique({ where: { mobile: lead.mobile } });
      if (customer) {
        const customerData: Record<string, unknown> = {};
        if (data.name !== undefined) customerData.name = data.name;
        if (data.mobile !== undefined) customerData.mobile = data.mobile;
        if (data.email !== undefined) customerData.email = data.email;
        if (data.city !== undefined) customerData.city = data.city;
        if (data.source !== undefined) customerData.source = data.source;
        if (data.notes !== undefined) customerData.notes = data.notes;
        if (data.contactOwnerId !== undefined) customerData.contactOwnerId = data.contactOwnerId;
        if (Object.keys(customerData).length > 0) {
          await tx.customer.update({ where: { id: customer.id }, data: customerData });
        }
      }

      return updated;
    });

    if (data.status && data.status !== lead.status) {
      if (data.status === LeadStatus.LOST) {
        await logActivity(id, userId, LeadActivityType.STATUS_CHANGED, `Status changed to LOST`);
      } else if (lead.status === LeadStatus.LOST) {
        await logActivity(id, userId, LeadActivityType.REOPENED, `Lead reopened — status set to ${data.status.replace(/_/g, " ")}`);
      } else {
        await logActivity(id, userId, LeadActivityType.STATUS_CHANGED, `Status changed from ${lead.status.replace(/_/g, " ")} to ${data.status.replace(/_/g, " ")}`);
      }
    }

    if (data.nextFollowUpAt !== undefined && data.nextFollowUpAt !== null) {
      const d = new Date(data.nextFollowUpAt).toLocaleString();
      await logActivity(id, userId, LeadActivityType.FOLLOW_UP_SET, `Follow-up scheduled for ${d}`);
    }

    if (data.name || data.email !== undefined || data.city !== undefined || data.source !== undefined || data.notes !== undefined) {
      await logActivity(id, userId, LeadActivityType.UPDATED, `Lead details updated`);
    }

    return updatedLead;
  }
  static async getLifecycle(id: string) {
    const lead = await prisma.lead.findUnique({ where: { id, isActive: true } });

    if (!lead) throw new AppError("Lead not found", 404);

    if (lead.status !== LeadStatus.WON) return null;

    const customer = await prisma.customer.findFirst({
      where: { mobile: lead.mobile, isActive: true },
    });

    if (!customer) return null;

    const project = await prisma.project.findFirst({
      where: { customerId: customer.id, isActive: true },
      include: {
        phaseTracking: { orderBy: { phase: "asc" } },
      },
    });

    return project ?? null;
  }

  static async deactivate(id: string, userId: string) {
    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead) throw new AppError("Lead not found", 404);

    await prisma.$transaction(async (tx) => {
      await tx.lead.update({ where: { id }, data: { isActive: false } });

      const customer = await tx.customer.findUnique({ where: { mobile: lead.mobile } });
      if (customer) {
        await tx.project.updateMany({ where: { customerId: customer.id }, data: { isActive: false } });
        await tx.customer.update({ where: { id: customer.id }, data: { isActive: false } });
      }
    });

    await logActivity(id, userId, LeadActivityType.STATUS_CHANGED, `Lead deleted`);
  }

  static async getActivities(id: string) {
    return prisma.leadActivity.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }
}
