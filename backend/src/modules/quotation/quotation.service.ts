import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";
import { SettingsService } from "@/modules/settings/settings.service";
import {
  Prisma,
  ProjectPhase,
  QuotationRevisionReason,
  QuotationStatus,
  QuotationType,
  ReminderPriority,
} from "@prisma/client";

type CreateQuotationInput = {
  createdById?: string;
  type?: QuotationType;
  leadId?: string;
  customerId?: string;
  projectId?: string;
  phase?: ProjectPhase | null;
  walkInName?: string;
  walkInMobile?: string;
  walkInEmail?: string | null;
  walkInAddress?: string | null;
  notes?: string;
  validUntil?: Date;
  discountAmount?: number;
  parentQuotationId?: string | null;
  revisionReason?: QuotationRevisionReason | null;
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
    const type = data.type ?? (data.leadId ? QuotationType.LEAD : data.customerId ? QuotationType.CUSTOMER : QuotationType.WALK_IN_CUSTOMER);

    if (type === QuotationType.LEAD && !data.leadId) {
      throw new AppError("Quotation must belong to a lead", 400);
    }

    if (type === QuotationType.CUSTOMER && !data.customerId) {
      throw new AppError("Quotation must belong to a customer", 400);
    }

    if (type === QuotationType.WALK_IN_CUSTOMER && (!data.walkInName || !data.walkInMobile)) {
      throw new AppError("Walk-in customer name and mobile are required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const settings = await SettingsService.getSettings();

    let validUntil = data.validUntil;
    if (!validUntil) {
      const validityDays = settings.quoteValidityDays || 30;
      validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
    }

    if (data.followUp) {
      if (validUntil && new Date(data.followUp.dueAt) >= new Date(validUntil)) {
        throw new AppError("Follow-up reminder due date must be before quotation expiry (validUntil)", 400);
      }
    }

    if (type === QuotationType.LEAD && data.leadId) {
      const lead = await prisma.lead.findUnique({
        where: {
          id: data.leadId,
        },
      });

      if (!lead) {
        throw new AppError("Lead not found", 404);
      }
    }

    if (type === QuotationType.CUSTOMER && data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: {
          id: data.customerId,
        },
      });

      if (!customer) {
        throw new AppError("Customer not found", 404);
      }
    }

    const lastQuotation = type === QuotationType.WALK_IN_CUSTOMER
      ? null
      : await prisma.quotation.findFirst({
          where: data.projectId
            ? {
                projectId: data.projectId,
                phase: data.phase ?? undefined,
              }
            : {
                leadId: data.leadId,
              },
          orderBy: {
            version: "desc",
          },
        });

    const version = lastQuotation ? lastQuotation.version + 1 : 1;

    let subtotal = 0;
    const itemData: Prisma.QuotationItemUncheckedCreateWithoutQuotationInput[] = [];

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

      let marginPercent = item.marginPercent;
      if (marginPercent === 0) {
        marginPercent = Number(settings.pricingDefaultMargin);
      }

      if (user.role === "SALESMAN") {
        if (!settings.pricingAllowMarginOverride) {
          if (marginPercent !== Number(settings.pricingDefaultMargin)) {
            throw new AppError(`Margin overrides are disabled. You must use the default margin of ${settings.pricingDefaultMargin}%`, 400);
          }
        } else {
          if (marginPercent < Number(settings.pricingMinMargin)) {
            throw new AppError(`Margin cannot be lower than the minimum allowed margin of ${settings.pricingMinMargin}%`, 400);
          }
        }
      }

      const costPrice = Number(product.costPrice);
      const sellingPrice = costPrice + (costPrice * marginPercent) / 100;
      const totalPrice = sellingPrice * item.quantity;

      subtotal += totalPrice;

      itemData.push({
        productId: product.id,
        quantity: item.quantity,
        costPrice,
        marginPercent,
        sellingPrice,
        totalPrice,
      });
    }

    const discountAmount = data.discountAmount || 0;
    if (user.role === "SALESMAN") {
      const maxDiscountPercent = Number(settings.pricingMaxDiscount);
      const maxDiscountAllowed = (subtotal * maxDiscountPercent) / 100;
      if (discountAmount > maxDiscountAllowed) {
        throw new AppError(`Discount exceeds the maximum allowed discount of ${maxDiscountPercent}% (max allowed: ₹${maxDiscountAllowed.toFixed(2)})`, 400);
      }
    }

    const totalAmount = Math.max(subtotal - discountAmount, 0);

    return prisma.$transaction(async (tx) => {
      const totalQuotes = await tx.quotation.count();
      const seq = totalQuotes + 1;

      const now = new Date();
      const yyyy = String(now.getFullYear());
      const yy = yyyy.slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");

      let quotationNumber = settings.quoteNumberFormat
        .replace("{YYYY}", yyyy)
        .replace("{YY}", yy)
        .replace("{MM}", mm)
        .replace("{DD}", dd);

      quotationNumber = quotationNumber.replace("{NNNNN}", String(seq).padStart(5, "0"));
      quotationNumber = quotationNumber.replace("{NNNN}", String(seq).padStart(4, "0"));
      quotationNumber = quotationNumber.replace("{NNN}", String(seq).padStart(3, "0"));
      quotationNumber = quotationNumber.replace("{NN}", String(seq).padStart(2, "0"));

      const existingNo = await tx.quotation.findUnique({
        where: { quotationNumber },
      });
      const finalQuotationNumber = existingNo ? `${quotationNumber}-${Date.now()}` : quotationNumber;

      const quotation = await tx.quotation.create({
        data: {
          quotationNumber: finalQuotationNumber,
          type,
          leadId: type === QuotationType.LEAD ? data.leadId : null,
          customerId: type === QuotationType.CUSTOMER ? data.customerId : null,
          projectId: type === QuotationType.CUSTOMER ? data.projectId : null,
          phase: type === QuotationType.CUSTOMER ? data.phase : null,
          walkInName: type === QuotationType.WALK_IN_CUSTOMER ? data.walkInName : null,
          walkInMobile: type === QuotationType.WALK_IN_CUSTOMER ? data.walkInMobile : null,
          walkInEmail: type === QuotationType.WALK_IN_CUSTOMER ? data.walkInEmail : null,
          walkInAddress: type === QuotationType.WALK_IN_CUSTOMER ? data.walkInAddress : null,
          version,
          subtotal,
          discountAmount,
          totalAmount,
          notes: data.notes,
          validUntil,
          createdById: data.createdById ?? userId,
          parentQuotationId: data.parentQuotationId || lastQuotation?.id,
          revisionReason: data.revisionReason || undefined,

          companyNameSnapshot: settings.companyName,
          companyLogoSnapshot: settings.companyLogo,
          companyGstSnapshot: settings.companyGst,
          companyAddressSnapshot: settings.companyAddress,
          companyPhoneSnapshot: settings.companyPhone,
          companyEmailSnapshot: settings.companyEmail,
          companyWebsiteSnapshot: settings.companyWebsite,
          bankNameSnapshot: settings.bankName,
          bankAccountNoSnapshot: settings.bankAccountNo,
          bankIfscSnapshot: settings.bankIfsc,
          bankBranchSnapshot: settings.bankBranch,
          upiIdSnapshot: settings.upiId,
          termsAndConditionsSnapshot: settings.termsAndConditions,
          authorizedSignatureSnapshot: settings.authorizedSignature,
          footerTextSnapshot: settings.footerText,

          items: {
            create: itemData,
          },
        },
        include: {
          items: true,
        },
      });

      if (quotation.leadId) {
        const isRevision = !!data.parentQuotationId;
        await tx.leadActivity.create({
          data: {
            leadId: quotation.leadId,
            userId,
            type: isRevision ? "UPDATED" : "QUOTATION_CREATED",
            message: isRevision
              ? `Quotation ${quotation.quotationNumber} (v${quotation.version}) created as edit of v${lastQuotation?.version || quotation.version - 1}`
              : `Quotation ${quotation.quotationNumber} created`,
          },
        });
      }

      if (data.followUp) {
        const reminder = await tx.reminder.create({
          data: {
            title: data.followUp.title ?? `Follow up on Quotation ${quotation.quotationNumber}`,
            description: data.followUp.description,
            type: quotation.leadId ? "LEAD" : quotation.customerId ? "CUSTOMER" : "QUOTATION",
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
              type: "REMINDER_CREATED",
              message: `Reminder created: ${reminder.title}`,
            },
          });
        }
      }

      if (quotation.projectId) {
        await tx.project.update({
          where: { id: quotation.projectId },
          data: {
            estimatedBudget: quotation.totalAmount,
          },
        });

        const isRevision = !!data.parentQuotationId;
        await tx.projectActivity.create({
          data: {
            projectId: quotation.projectId,
            userId,
            type: isRevision ? "QUOTATION_EDITED" : "QUOTATION_CREATED",
            message: isRevision
              ? `Quotation ${quotation.quotationNumber} edited (v${quotation.version} created from v${lastQuotation?.version || quotation.version - 1})`
              : `Quotation ${quotation.quotationNumber} (v${quotation.version}) created in ${quotation.phase} Phase`,
          },
        });
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
          type: true,
          phase: true,
          version: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          walkInName: true,
          walkInMobile: true,
          walkInEmail: true,
          walkInAddress: true,

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
        payment: {
          include: {
            transactions: {
              orderBy: { date: "desc" },
            },
          },
        },
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
      include: {
        payment: {
          select: {
            id: true,
            status: true,
            amountReceived: true,
            pendingAmount: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            mobile: true,
            creditAllowed: true,
            maxCreditAmount: true,
            defaultCreditDays: true,
          },
        },
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const settings = await SettingsService.getSettings();

    if (status === QuotationStatus.APPROVED) {
      if (user.role !== "OWNER") {
        const allowedRoles = (settings.rolePermissions as Record<string, string[]> | null)?.approveQuotations || [];
        if (!allowedRoles.includes(user.role)) {
          throw new AppError(`You do not have permission to approve quotations`, 403);
        }
      }
    }

    const quotation = await prisma.quotation.findUnique({
      where: {
        id,
      },
    });

    if (!quotation) {
      throw new AppError("Quotation not found", 404);
    }

    if (followUp) {
      const hasSentAt = quotation.sentAt || status === QuotationStatus.SENT;
      const hasValidUntil = quotation.validUntil;
      if (!hasSentAt && !hasValidUntil) {
        throw new AppError("Follow-up reminders can only be created if the quotation is sent or has an expiry date", 400);
      }
      if (hasValidUntil && new Date(followUp.dueAt) >= new Date(hasValidUntil)) {
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

      if (quotation.projectId) {
        const activityType = `QUOTATION_${status}`;
        await tx.projectActivity.create({
          data: {
            projectId: quotation.projectId,
            userId,
            type: activityType,
            message: `Quotation ${updatedQuotation.quotationNumber} status updated to ${status.toLowerCase()}`,
          },
        });
      }

      if (followUp) {
        const reminder = await tx.reminder.create({
          data: {
            title: followUp.title ?? `Follow up on Quotation ${quotation.quotationNumber}`,
            description: followUp.description,
            type: quotation.leadId ? "LEAD" : quotation.customerId ? "CUSTOMER" : "QUOTATION",
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
              type: "REMINDER_CREATED",
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

    const latestVersion = quotation.type === QuotationType.WALK_IN_CUSTOMER
      ? null
      : await prisma.quotation.findFirst({
          where: {
            leadId: quotation.leadId,

            projectId: quotation.projectId,

            phase: quotation.phase,
          },
          orderBy: {
            version: "desc",
          },
        });

    const version = latestVersion ? latestVersion.version + 1 : quotation.version + 1;

    const settings = await SettingsService.getSettings();

    return prisma.$transaction(async (tx) => {
      const totalQuotes = await tx.quotation.count();
      const seq = totalQuotes + 1;

      const now = new Date();
      const yyyy = String(now.getFullYear());
      const yy = yyyy.slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");

      let quotationNumber = settings.quoteNumberFormat
        .replace("{YYYY}", yyyy)
        .replace("{YY}", yy)
        .replace("{MM}", mm)
        .replace("{DD}", dd);

      quotationNumber = quotationNumber.replace("{NNNNN}", String(seq).padStart(5, "0"));
      quotationNumber = quotationNumber.replace("{NNNN}", String(seq).padStart(4, "0"));
      quotationNumber = quotationNumber.replace("{NNN}", String(seq).padStart(3, "0"));
      quotationNumber = quotationNumber.replace("{NN}", String(seq).padStart(2, "0"));

      const existingNo = await tx.quotation.findUnique({
        where: { quotationNumber },
      });
      const finalQuotationNumber = existingNo ? `${quotationNumber}-${Date.now()}` : quotationNumber;

      const newQuotation = await tx.quotation.create({
        data: {
          quotationNumber: finalQuotationNumber,

          type: quotation.type,

          leadId: quotation.leadId,

          customerId: quotation.customerId,

          projectId: quotation.projectId,

          phase: quotation.phase,

          walkInName: quotation.walkInName,
          walkInMobile: quotation.walkInMobile,
          walkInEmail: quotation.walkInEmail,
          walkInAddress: quotation.walkInAddress,

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

          companyNameSnapshot: settings.companyName,
          companyLogoSnapshot: settings.companyLogo,
          companyGstSnapshot: settings.companyGst,
          companyAddressSnapshot: settings.companyAddress,
          companyPhoneSnapshot: settings.companyPhone,
          companyEmailSnapshot: settings.companyEmail,
          companyWebsiteSnapshot: settings.companyWebsite,
          bankNameSnapshot: settings.bankName,
          bankAccountNoSnapshot: settings.bankAccountNo,
          bankIfscSnapshot: settings.bankIfsc,
          bankBranchSnapshot: settings.bankBranch,
          upiIdSnapshot: settings.upiId,
          termsAndConditionsSnapshot: settings.termsAndConditions,
          authorizedSignatureSnapshot: settings.authorizedSignature,
          footerTextSnapshot: settings.footerText,
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

      if (newQuotation.projectId) {
        await tx.project.update({
          where: { id: newQuotation.projectId },
          data: {
            estimatedBudget: newQuotation.totalAmount,
          },
        });
      }

      return newQuotation;
    });
  }
}
