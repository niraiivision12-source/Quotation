import {
  LeadActivityType,
  ProjectPhase,
  QuotationStatus,
} from "@prisma/client";

import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";

export class LeadQuotationService {
  static async create(data: {
    leadId: string;
    phase?: ProjectPhase;
    notes?: string;
    items: {
      productId: string;
      quantity: number;
      sellingPrice: number;
    }[];
  }) {
    const lead = await prisma.lead.findUnique({
      where: {
        id: data.leadId,
      },
    });

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    if (data.items.length === 0) {
      throw new AppError("At least one quotation item is required", 400);
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: data.items.map((item) => item.productId),
        },
      },
    });

    if (products.length !== data.items.length) {
      throw new AppError("One or more products not found", 404);
    }

    let subtotal = 0;

    const quotationItems = data.items.map((item) => {
      const totalPrice = Number(item.sellingPrice) * item.quantity;

      subtotal += totalPrice;

      return {
        productId: item.productId,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        totalPrice,
      };
    });

    const quotationCount = await prisma.leadQuotation.count();

    const quotationNumber = `LQ-${String(quotationCount + 1).padStart(5, "0")}`;

    return prisma.$transaction(async (tx) => {
      const quotation = await tx.leadQuotation.create({
        data: {
          quotationNumber,

          leadId: data.leadId,

          phase: data.phase,

          notes: data.notes,

          subtotal,

          totalAmount: subtotal,

          status: QuotationStatus.DRAFT,

          items: {
            create: quotationItems,
          },
        },

        include: {
          lead: true,

          items: {
            include: {
              product: true,
            },
          },
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: lead.id,

          type: LeadActivityType.QUOTATION_CREATED,

          message: `Quotation ${quotation.quotationNumber} created`,
        },
      });

      return quotation;
    });
  }

  static async getById(id: string) {
    const quotation = await prisma.leadQuotation.findUnique({
      where: {
        id,
      },

      include: {
        lead: true,

        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!quotation) {
      throw new AppError("Quotation not found", 404);
    }

    return quotation;
  }

  static async getByLeadId(leadId: string) {
    return prisma.leadQuotation.findMany({
      where: {
        leadId,
      },

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
    });
  }

  static async updateStatus(id: string, status: QuotationStatus) {
    const quotation = await prisma.leadQuotation.findUnique({
      where: {
        id,
      },
    });

    if (!quotation) {
      throw new AppError("Quotation not found", 404);
    }

    const updateData: {
      status: QuotationStatus;
      sentAt?: Date;
      approvedAt?: Date;
      rejectedAt?: Date;
    } = {
      status,
    };

    let activityType: LeadActivityType = LeadActivityType.STATUS_CHANGED;

    let activityMessage = "";

    if (status === QuotationStatus.SENT) {
      updateData.sentAt = new Date();

      activityType = LeadActivityType.QUOTATION_SENT;

      activityMessage = `Quotation ${quotation.quotationNumber} sent`;
    }

    if (status === QuotationStatus.APPROVED) {
      updateData.approvedAt = new Date();

      activityType = LeadActivityType.QUOTATION_APPROVED;

      activityMessage = `Quotation ${quotation.quotationNumber} approved`;
    }

    if (status === QuotationStatus.REJECTED) {
      updateData.rejectedAt = new Date();

      activityType = LeadActivityType.QUOTATION_REJECTED;

      activityMessage = `Quotation ${quotation.quotationNumber} rejected`;
    }

    if (status === QuotationStatus.DRAFT) {
      activityMessage = `Quotation ${quotation.quotationNumber} moved to draft`;
    }

    if (status === QuotationStatus.EXPIRED) {
      activityMessage = `Quotation ${quotation.quotationNumber} expired`;
    }

    return prisma.$transaction(async (tx) => {
      const updatedQuotation = await tx.leadQuotation.update({
        where: {
          id,
        },
        data: updateData,
      });

      await tx.leadActivity.create({
        data: {
          leadId: quotation.leadId,

          type: activityType,

          message: activityMessage,
        },
      });

      return updatedQuotation;
    });
  }

  static async delete(id: string) {
    const quotation = await prisma.leadQuotation.findUnique({
      where: {
        id,
      },
    });

    if (!quotation) {
      throw new AppError("Quotation not found", 404);
    }

    return prisma.leadQuotation.delete({
      where: {
        id,
      },
    });
  }
}
