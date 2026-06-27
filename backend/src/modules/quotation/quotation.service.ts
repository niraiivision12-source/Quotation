import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";
import {
  Prisma,
  ProjectPhase,
  QuotationRevisionReason,
  QuotationStatus,
  ReminderPriority,
} from "@prisma/client";

type CreateQuotationInput = {
  createdById?: string;
  leadId?: string;
  customerId?: string;
  projectId?: string;
  phase?: ProjectPhase;
  notes?: string;
  validUntil?: Date;
  items: {
    productId: string;
    quantity: number;
    marginPercent: number;
  }[];
  followUp?: {
    title?: string;
    description?: string;
    priority?: ReminderPriority;
    dueAt: Date;
  };
};

async function updateLeadNextFollowUp(tx: Prisma.TransactionClient, leadId: string) {
  const nextReminder = await tx.reminder.findFirst({
    where: {
      leadId,
      status: "PENDING",
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

export class QuotationService {
  static async create(userId: string, data: CreateQuotationInput) {
    if (!data.leadId && !data.customerId) {
      throw new AppError("Quotation must belong to a lead or customer", 400);
    }

    if (data.followUp) {
      if (data.validUntil && new Date(data.followUp.dueAt) >= new Date(data.validUntil)) {
        throw new AppError("Follow-up reminder due date must be before quotation expiry (validUntil)", 400);
      }
    }

    if (data.leadId) {
      const lead = await prisma.lead.findUnique({
        where: {
          id: data.leadId,
        },
      });

      if (!lead) {
        throw new AppError("Lead not found", 404);
      }
    }

    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: {
          id: data.customerId,
        },
      });

      if (!customer) {
        throw new AppError("Customer not found", 404);
      }
    }

    const lastQuotation = await prisma.quotation.findFirst({
      where: data.projectId
        ? {
            projectId: data.projectId,
            phase: data.phase,
          }
        : {
            leadId: data.leadId,
          },
      orderBy: {
        version: "desc",
      },
    });

    const version = lastQuotation ? lastQuotation.version + 1 : 1;

    const quotationNumber = `QT-${Date.now()}`;

    let subtotal = 0;

    const itemData: Prisma.QuotationItemUncheckedCreateWithoutQuotationInput[] =
      [];

    // Validate quotation has at least one item
    if (data.items.length === 0) {
      throw new AppError("Quotation must contain at least one item", 400);
    }

    for (const item of data.items) {
      if (item.quantity <= 0) {
        throw new AppError("Invalid quantity", 400);
      }

      const product = await prisma.product.findUnique({
        where: {
          id: item.productId,
        },
      });

      if (!product) {
        throw new AppError("Product not found", 404);
      }

      if (!product.isActive) {
        throw new AppError("Product is inactive", 400);
      }

      const costPrice = Number(product.costPrice);

      const sellingPrice = costPrice + (costPrice * item.marginPercent) / 100;

      const totalPrice = sellingPrice * item.quantity;

      subtotal += totalPrice;

      itemData.push({
        productId: product.id,
        quantity: item.quantity,
        costPrice,
        marginPercent: item.marginPercent,
        sellingPrice,
        totalPrice,
      });
    }

    return prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.create({
        data: {
          quotationNumber,

          leadId: data.leadId,

          customerId: data.customerId,

          projectId: data.projectId,

          phase: data.phase,

          version,

          subtotal,

          totalAmount: subtotal,

          notes: data.notes,

          validUntil: data.validUntil,

          createdById: data.createdById ?? userId,

          parentQuotationId: lastQuotation?.id,

          items: {
            create: itemData,
          },
        },
        include: {
          items: true,
        },
      });

      if (quotation.leadId) {
        await tx.leadActivity.create({
          data: {
            leadId: quotation.leadId,
            type: "QUOTATION_CREATED",
            message: `Quotation ${quotation.quotationNumber} created`,
          },
        });

        await tx.lead.update({
          where: {
            id: quotation.leadId,
          },
          data: {
            status: "QUOTATION_SENT",
          },
        });
      }

      if (data.followUp) {
        const reminder = await tx.reminder.create({
          data: {
            title: data.followUp.title ?? `Follow up on Quotation ${quotation.quotationNumber}`,
            description: data.followUp.description,
            type: "LEAD",
            priority: data.followUp.priority ?? "MEDIUM",
            dueAt: new Date(data.followUp.dueAt),
            userId,
            leadId: quotation.leadId,
            customerId: quotation.customerId,
            projectId: quotation.projectId,
          },
        });

        if (quotation.leadId) {
          await updateLeadNextFollowUp(tx, quotation.leadId);

          await tx.leadActivity.create({
            data: {
              leadId: quotation.leadId,
              userId,
              type: "FOLLOW_UP_SET",
              message: `Reminder created: ${reminder.title}`,
            },
          });
        }
      }

      return quotation;
    });
  }

  static async getAll(
    page: number,
    limit: number,
    leadId?: string,
    projectId?: string,
    customerId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      ...(leadId && {
        leadId,
      }),
      ...(projectId && {
        projectId,
      }),
      ...(customerId && {
        customerId,
      }),
    };

    const [items, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          quotationNumber: true,
          phase: true,
          version: true,
          status: true,
          totalAmount: true,
          createdAt: true,

          lead: {
            select: {
              id: true,
              name: true,
              mobile: true,
            },
          },

          customer: {
            select: {
              id: true,
              name: true,
              mobile: true,
            },
          },

          project: {
            select: {
              id: true,
              projectName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.quotation.count({
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
    const quotation = await prisma.quotation.findUnique({
      where: {
        id,
      },
      include: {
        lead: true,
        customer: true,
        project: true,
        createdBy: true,
        items: {
          include: {
            product: true,
          },
        },
        childVersions: true,
        parentQuotation: true,
      },
    });

    if (!quotation) {
      throw new AppError("Quotation not found", 404);
    }

    return quotation;
  }

  static async getProjectQuotations(projectId: string) {
    return prisma.quotation.findMany({
      where: {
        projectId,
      },
      orderBy: [
        {
          phase: "asc",
        },
        {
          version: "desc",
        },
      ],
    });
  }

  static async updateStatus(
    id: string,
    status: QuotationStatus,
    userId: string,
    followUp?: {
      title?: string;
      description?: string;
      priority?: ReminderPriority;
      dueAt: Date;
    },
  ) {
    const quotation = await prisma.quotation.findUnique({
      where: {
        id,
      },
    });

    if (!quotation) {
      throw new AppError("Quotation not found", 404);
    }

    if (followUp) {
      if (quotation.validUntil && new Date(followUp.dueAt) >= new Date(quotation.validUntil)) {
        throw new AppError("Follow-up reminder due date must be before quotation expiry (validUntil)", 400);
      }
    }

    const transitions: Record<QuotationStatus, QuotationStatus[]> = {
      DRAFT: [QuotationStatus.SENT],

      SENT: [
        QuotationStatus.APPROVED,
        QuotationStatus.REJECTED,
        QuotationStatus.EXPIRED,
      ],

      APPROVED: [],

      REJECTED: [],

      EXPIRED: [],
    };

    const allowed = transitions[quotation.status];

    if (!allowed.includes(status)) {
      throw new AppError(
        `Cannot move quotation from ${quotation.status} to ${status}`,
        400,
      );
    }

    return prisma.$transaction(async (tx) => {
      const updatedQuotation = await tx.quotation.update({
        where: {
          id,
        },
        data: {
          status,

          sentAt:
            status === QuotationStatus.SENT ? new Date() : quotation.sentAt,

          approvedAt:
            status === QuotationStatus.APPROVED
              ? new Date()
              : quotation.approvedAt,

          rejectedAt:
            status === QuotationStatus.REJECTED
              ? new Date()
              : quotation.rejectedAt,
        },
      });

      if (quotation.leadId) {
        let activityType:
          | "QUOTATION_SENT"
          | "QUOTATION_APPROVED"
          | "QUOTATION_REJECTED"
          | null = null;

        if (status === QuotationStatus.SENT) activityType = "QUOTATION_SENT";

        if (status === QuotationStatus.APPROVED)
          activityType = "QUOTATION_APPROVED";

        if (quotation.leadId && status === QuotationStatus.APPROVED) {
          await tx.lead.update({
            where: {
              id: quotation.leadId,
            },
            data: {
              status: "WON",
            },
          });
        }

        if (status === QuotationStatus.REJECTED)
          activityType = "QUOTATION_REJECTED";

        if (activityType) {
          await tx.leadActivity.create({
            data: {
              leadId: quotation.leadId,
              type: activityType,
              message: `Quotation ${updatedQuotation.quotationNumber} ${status.toLowerCase()}`,
            },
          });
        }
      }

      if (followUp) {
        const reminder = await tx.reminder.create({
          data: {
            title: followUp.title ?? `Follow up on Quotation ${quotation.quotationNumber}`,
            description: followUp.description,
            type: "LEAD",
            priority: followUp.priority ?? "MEDIUM",
            dueAt: new Date(followUp.dueAt),
            userId,
            leadId: quotation.leadId,
            customerId: quotation.customerId,
            projectId: quotation.projectId,
          },
        });

        if (quotation.leadId) {
          await updateLeadNextFollowUp(tx, quotation.leadId);

          await tx.leadActivity.create({
            data: {
              leadId: quotation.leadId,
              userId,
              type: "FOLLOW_UP_SET",
              message: `Reminder created: ${reminder.title}`,
            },
          });
        }
      }

      return updatedQuotation;
    });
  }

  static async createRevision(
    quotationId: string,
    userId: string,
    revisionReason: QuotationRevisionReason,
  ) {
    const quotation = await prisma.quotation.findUnique({
      where: {
        id: quotationId,
      },
      include: {
        items: true,
      },
    });

    if (!quotation) {
      throw new AppError("Quotation not found", 404);
    }

    const childVersion = await prisma.quotation.findFirst({
      where: {
        parentQuotationId: quotation.id,
      },
    });

    if (childVersion) {
      throw new AppError(
        "Revision already exists. Create revision from latest version.",
        400,
      );
    }

    if (quotation.status === "DRAFT") {
      throw new AppError("Draft quotation cannot be revised", 400);
    }

    if (quotation.status === "APPROVED") {
      throw new AppError("Approved quotation cannot be revised", 400);
    }

    const latestVersion = await prisma.quotation.findFirst({
      where: {
        leadId: quotation.leadId,

        projectId: quotation.projectId,

        phase: quotation.phase,
      },
      orderBy: {
        version: "desc",
      },
    });

    const version = latestVersion ? latestVersion.version + 1 : 1;

    return prisma.$transaction(async (tx) => {
      const newQuotation = await tx.quotation.create({
        data: {
          quotationNumber: `QT-${Date.now()}`,

          leadId: quotation.leadId,

          customerId: quotation.customerId,

          projectId: quotation.projectId,

          phase: quotation.phase,

          version,

          status: "DRAFT",

          subtotal: quotation.subtotal,

          discountAmount: quotation.discountAmount,

          totalAmount: quotation.totalAmount,

          notes: quotation.notes,

          validUntil: quotation.validUntil,

          parentQuotationId: quotation.id,

          revisionReason,

          createdById: userId,
        },
      });

      await tx.quotationItem.createMany({
        data: quotation.items.map((item) => ({
          quotationId: newQuotation.id,

          productId: item.productId,

          quantity: item.quantity,

          costPrice: item.costPrice,

          marginPercent: item.marginPercent,

          sellingPrice: item.sellingPrice,

          totalPrice: item.totalPrice,
        })),
      });

      return newQuotation;
    });
  }
}
