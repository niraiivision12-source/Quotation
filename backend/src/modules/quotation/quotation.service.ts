import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";
import {
  Prisma,
  QuotationRevisionReason,
  QuotationStatus,
} from "@prisma/client";

export class QuotationService {
  static async create(userId: string, data: any) {
    const project = await prisma.project.findUnique({
      where: {
        id: data.projectId,
      },
      include: {
        customer: true,
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    if (project.customerId !== data.customerId) {
      throw new AppError("Project does not belong to customer", 400);
    }

    const lastQuotation = await prisma.quotation.findFirst({
      where: {
        projectId: data.projectId,
        phase: data.phase,
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

          customerId: data.customerId,

          projectId: data.projectId,

          phase: data.phase,

          version,

          subtotal,

          totalAmount: subtotal,

          notes: data.notes,

          validUntil: data.validUntil,

          createdById: userId,

          parentQuotationId: lastQuotation?.id,

          items: {
            create: itemData,
          },
        },
        include: {
          items: true,
        },
      });

      return quotation;
    });
  }

  static async getAll(
    page: number,
    limit: number,
    projectId?: string,
    customerId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where = {
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

  static async updateStatus(id: string, status: QuotationStatus) {
    const quotation = await prisma.quotation.findUnique({
      where: {
        id,
      },
    });

    if (!quotation) {
      throw new AppError("Quotation not found", 404);
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

    return prisma.quotation.update({
      where: {
        id,
      },
      data: {
        status,

        approvedAt: status === QuotationStatus.APPROVED ? new Date() : null,

        rejectedAt: status === QuotationStatus.REJECTED ? new Date() : null,
      },
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
