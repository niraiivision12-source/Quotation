import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";

export class QuotationService {
  static async create(userId: string, data: any) {
    const project = await prisma.project.findUnique({
      where: {
        id: data.projectId,
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
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

    const itemData = [];

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: {
          id: item.productId,
        },
      });

      if (!product) {
        throw new AppError("Product not found", 404);
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

    const quotation = await prisma.quotation.create({
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
  }
}
