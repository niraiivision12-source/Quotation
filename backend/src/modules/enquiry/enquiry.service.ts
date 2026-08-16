import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import { EnquiryStatus, OpportunityStatus, ProductCategory } from "@prisma/client";

export class EnquiryService {
  static async checkMobileExists(mobile: string) {
    const existingPending = await prisma.enquiry.findFirst({
      where: { mobile, status: EnquiryStatus.PENDING },
      select: { id: true, name: true, mobile: true, status: true },
    });

    if (existingPending) {
      return {
        exists: true,
        existingId: existingPending.id,
        existingName: existingPending.name,
        existingStatus: existingPending.status,
        message: "An enquiry with this mobile number is already pending in the inbox",
      };
    }

    // Also check for triaged enquiries (already converted to opportunity)
    const existingTriaged = await prisma.enquiry.findFirst({
      where: { mobile, status: EnquiryStatus.TRIAGED },
      select: { id: true, name: true, mobile: true, status: true },
    });

    if (existingTriaged) {
      return {
        exists: true,
        existingId: existingTriaged.id,
        existingName: existingTriaged.name,
        existingStatus: existingTriaged.status,
        message: "An enquiry with this mobile number already exists and has been processed",
      };
    }

    return { exists: false };
  }

  static async create(data: {
    name: string;
    mobile: string;
    email?: string | null;
    source?: string;
    message?: string | null;
    city?: string | null;
  }) {
    const existingPending = await prisma.enquiry.findFirst({
      where: { mobile: data.mobile, status: EnquiryStatus.PENDING },
    });

    if (existingPending) {
      throw new AppError("An enquiry from this mobile number is already pending in the inbox", 409);
    }

    return prisma.enquiry.create({
      data: {
        name: data.name,
        mobile: data.mobile,
        email: data.email ?? null,
        source: data.source ?? "MANUAL",
        message: data.message ?? null,
        city: data.city ?? null,
        status: EnquiryStatus.PENDING,
      },
    });
  }

  static async getAll(
    page: number,
    limit: number,
    search?: string,
    status?: EnquiryStatus
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.enquiry.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  static async triage(id: string, category: ProductCategory, notes?: string | null) {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
    });

    if (!enquiry) {
      throw new AppError("Enquiry not found", 404);
    }

    if (enquiry.status !== EnquiryStatus.PENDING) {
      throw new AppError("Enquiry has already been triaged or ignored", 400);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update Enquiry status and category
      const updatedEnquiry = await tx.enquiry.update({
        where: { id },
        data: {
          status: EnquiryStatus.TRIAGED,
          category,
        },
      });

      // 2. Find or Create Customer
      let customer = await tx.customer.findUnique({
        where: { mobile: enquiry.mobile },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: enquiry.name,
            mobile: enquiry.mobile,
            email: enquiry.email,
            source: enquiry.source,
            city: enquiry.city,
          },
        });

        await tx.customerActivity.create({
          data: {
            customerId: customer.id,
            type: "CREATED",
            message: "Customer created automatically from enquiry triage",
          },
        });
      }

      // 3. Resolve Salesperson from Settings Mappings
      const settings = await tx.systemSettings.findUnique({
        where: { id: "default" },
      });

      const mappings = (settings?.categorySalesmanAssignment as Record<string, any>) || {};
      const catConfig = mappings[category];
      let assignedToId: string | null = null;
      if (typeof catConfig === "string") {
        assignedToId = catConfig;
      } else if (catConfig && typeof catConfig === "object") {
        assignedToId = catConfig.primarySalespersonId || null;
      }

      if (assignedToId) {
        // Validate that user exists and is a salesman and is active
        const salesperson = await tx.user.findFirst({
          where: { id: assignedToId, role: "SALESMAN", isActive: true },
        });

        if (!salesperson) {
          assignedToId = null;
        }
      }

      // Fallback: assign to the first active Owner
      if (!assignedToId) {
        const owner = await tx.user.findFirst({
          where: { role: "OWNER", isActive: true },
        });
        assignedToId = owner?.id || null;
      }

      // 4. Create Opportunity
      const opportunity = await tx.opportunity.create({
        data: {
          customerId: customer.id,
          category,
          status: OpportunityStatus.NEW,
          assignedToId,
          source: enquiry.source,
        },
      });

      // 5. Create Activity Logs
      const trimmedNotes = notes?.trim() || null;

      await tx.opportunityActivity.create({
        data: {
          opportunityId: opportunity.id,
          type: "CREATED",
          message: trimmedNotes
            ? `Opportunity created in category ${category} and assigned to salesperson. Notes: ${trimmedNotes}`
            : `Opportunity created in category ${category} and assigned to salesperson`,
        },
      });

      await tx.customerActivity.create({
        data: {
          customerId: customer.id,
          type: "OPPORTUNITY_CREATED",
          message: trimmedNotes
            ? `Created opportunity for ${category} linked to enquiry triage. Notes: ${trimmedNotes}`
            : `Created opportunity for ${category} linked to enquiry triage`,
          metadata: { opportunityId: opportunity.id },
        },
      });

      return {
        enquiry: updatedEnquiry,
        customer,
        opportunity,
      };
    });
  }

  static async ignore(id: string) {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
    });

    if (!enquiry) {
      throw new AppError("Enquiry not found", 404);
    }

    if (enquiry.status !== EnquiryStatus.PENDING) {
      throw new AppError("Enquiry has already been processed", 400);
    }

    return prisma.enquiry.update({
      where: { id },
      data: {
        status: EnquiryStatus.IGNORED,
      },
    });
  }

  // ─── New: Delete (permanent hard delete) ───────────────────────────────────
  static async delete(id: string) {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
    });

    if (!enquiry) {
      throw new AppError("Enquiry not found", 404);
    }

    return prisma.$transaction(async (tx) => {
      if (enquiry.status === EnquiryStatus.TRIAGED) {
        const customer = await tx.customer.findUnique({
          where: { mobile: enquiry.mobile },
        });
        if (customer) {
          const opportunity = await tx.opportunity.findFirst({
            where: { customerId: customer.id, category: enquiry.category || undefined },
          });
          if (opportunity) {
            await tx.quotation.deleteMany({
              where: { opportunityId: opportunity.id },
            });
            await tx.opportunity.delete({
              where: { id: opportunity.id },
            });
          }
        }
      }

      return tx.enquiry.delete({
        where: { id },
      });
    });
  }

  // ─── New: Update (PENDING only — triaged/ignored are immutable) ────────────
  static async update(
    id: string,
    data: {
      name?: string;
      email?: string | null;
      city?: string | null;
      message?: string | null;
      source?: string;
    }
  ) {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
    });

    if (!enquiry) {
      throw new AppError("Enquiry not found", 404);
    }

    if (enquiry.status !== EnquiryStatus.PENDING) {
      throw new AppError(
        "Only PENDING enquiries can be edited. Triaged and ignored enquiries are immutable.",
        400
      );
    }

    return prisma.enquiry.update({
      where: { id },
      data: {
        name: data.name ?? enquiry.name,
        email: data.email !== undefined ? data.email : enquiry.email,
        city: data.city !== undefined ? data.city : enquiry.city,
        message: data.message !== undefined ? data.message : enquiry.message,
        source: data.source ?? enquiry.source,
      },
    });
  }

  // ─── New: Restore IGNORED → PENDING ────────────────────────────────────────
  static async restore(id: string) {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
    });

    if (!enquiry) {
      throw new AppError("Enquiry not found", 404);
    }

    if (enquiry.status !== EnquiryStatus.IGNORED) {
      throw new AppError("Only IGNORED enquiries can be restored to PENDING", 400);
    }

    return prisma.enquiry.update({
      where: { id },
      data: {
        status: EnquiryStatus.PENDING,
      },
    });
  }

  // ─── New: Bulk Delete ───────────────────────────────────────────────────────
  static async bulkDelete(ids: string[]) {
    const count = await prisma.enquiry.deleteMany({
      where: { id: { in: ids } },
    });

    return { deleted: count.count };
  }

  // ─── New: Bulk Ignore (PENDING only) ───────────────────────────────────────
  static async bulkIgnore(ids: string[]) {
    const count = await prisma.enquiry.updateMany({
      where: { id: { in: ids }, status: EnquiryStatus.PENDING },
      data: { status: EnquiryStatus.IGNORED },
    });

    return { ignored: count.count };
  }

  // ─── New: Export (returns all matching records for CSV download) ────────────
  static async exportAll(search?: string, status?: EnquiryStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search } },
      ];
    }

    return prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }
}
