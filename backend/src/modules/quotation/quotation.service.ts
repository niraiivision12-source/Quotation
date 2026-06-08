import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";
import { Prisma } from "@prisma/client";

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
}
