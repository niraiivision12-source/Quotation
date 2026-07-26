import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import { EnquiryStatus, OpportunityStatus, ProductCategory } from "@prisma/client";

export class EnquiryService {
  static async create(data: {
    name: string;
    mobile: string;
    email?: string | null;
    source?: string;
    message?: string | null;
    city?: string | null;
  }) {
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
}
