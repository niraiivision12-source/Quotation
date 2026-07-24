import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import { OpportunityStatus, ProductCategory, Prisma, UserRole } from "@prisma/client";

export class OpportunityService {
  static async getAssignedCategories(userId: string): Promise<ProductCategory[]> {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
    });

    const mappings = (settings?.categorySalesmanAssignment as Record<string, any>) || {};
    const categories: ProductCategory[] = [];

    for (const [cat, config] of Object.entries(mappings)) {
      if (typeof config === "string") {
        if (config === userId) {
          categories.push(cat as ProductCategory);
        }
      } else if (config && typeof config === "object") {
        const isPrimary = config.primarySalespersonId === userId;
        const isBackup = config.backupSalespersonId === userId;
        const isAdditional = Array.isArray(config.additionalEditors) && config.additionalEditors.includes(userId);
        if (isPrimary || isBackup || isAdditional) {
          categories.push(cat as ProductCategory);
        }
      }
    }

    return categories;
  }

  static async getAll(
    userId: string,
    userRole: UserRole,
    page: number,
    limit: number,
    search?: string,
    filters?: {
      category?: ProductCategory;
      status?: OpportunityStatus;
    }
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.OpportunityWhereInput = {
      isActive: true,
    };

    // All users can retrieve all active opportunities for pipeline visibility
    // Access control is enforced when modifying opportunities, reminders, or quotations.

    // Apply filters
    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (search) {
      where.customer = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { mobile: { contains: search } },
        ],
      };
    }

    // Fetch all items matching query
    // To sort overdue first, we fetch pending items, evaluate overdue in JS, and merge
    const items = await prisma.opportunity.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { createdAt: "asc" }, // FIFO default
      ],
    });

    // Custom sorting:
    // 1. Yesterday's overdue follow-ups first (nextFollowUpAt < now and status not WON/LOST)
    // 2. Remaining items sorted FIFO (createdAt ASC)
    const now = new Date();
    const overdueItems: typeof items = [];
    const regularItems: typeof items = [];

    for (const item of items) {
      const isOverdue =
        item.nextFollowUpAt &&
        new Date(item.nextFollowUpAt) < now &&
        item.status !== OpportunityStatus.WON &&
        item.status !== OpportunityStatus.LOST;

      if (isOverdue) {
        overdueItems.push(item);
      } else {
        regularItems.push(item);
      }
    }

    // Sort overdue items by nextFollowUpAt asc (oldest overdue first)
    overdueItems.sort((a, b) => {
      const dateA = a.nextFollowUpAt ? new Date(a.nextFollowUpAt).getTime() : 0;
      const dateB = b.nextFollowUpAt ? new Date(b.nextFollowUpAt).getTime() : 0;
      return dateA - dateB;
    });

    const sortedItems = [...overdueItems, ...regularItems];
    const paginatedItems = sortedItems.slice(skip, skip + limit);
    const total = sortedItems.length;

    return {
      items: paginatedItems,
      total,
      page,
      limit,
    };
  }

  static async getById(id: string, userId: string, userRole: UserRole) {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id, isActive: true },
      include: {
        customer: {
          include: {
            payments: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quotations: {
          orderBy: { createdAt: "desc" },
        },
        reminders: {
          orderBy: { dueAt: "asc" },
        },
        tasks: {
          orderBy: { dueAt: "asc" },
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!opportunity) {
      throw new AppError("Opportunity not found", 404);
    }

    // Validate salesperson visibility
    if (userRole !== UserRole.OWNER) {
      const assignedCats = await this.getAssignedCategories(userId);
      const isAssignedCat = assignedCats.includes(opportunity.category);
      const isAssignedUser = opportunity.assignedToId === userId;

      if (!isAssignedCat && !isAssignedUser) {
        throw new AppError("You do not have permission to view this opportunity", 403);
      }
    }

    return opportunity;
  }

  static async update(
    id: string,
    userId: string,
    userRole: UserRole,
    data: {
      status?: OpportunityStatus;
      estimatedValue?: number | null;
      assignedToId?: string | null;
      nextFollowUpAt?: Date | null;
      lostReason?: string | null;
      followUp?: {
        title?: string;
        description?: string;
        priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        dueAt: Date;
      };
    }
  ) {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      throw new AppError("Opportunity not found", 404);
    }

    // Validate permissions
    if (userRole !== UserRole.OWNER) {
      const assignedCats = await this.getAssignedCategories(userId);
      const isAssignedCat = assignedCats.includes(opportunity.category);
      const isAssignedUser = opportunity.assignedToId === userId;

      if (!isAssignedCat && !isAssignedUser) {
        throw new AppError("You do not have permission to edit this opportunity", 403);
      }
    }

    return prisma.$transaction(async (tx) => {
      const originalStatus = opportunity.status;
      const newStatus = data.status ?? originalStatus;

      // 1. Update opportunity
      const updatedOpportunity = await tx.opportunity.update({
        where: { id },
        data: {
          status: newStatus,
          estimatedValue: data.estimatedValue !== undefined ? data.estimatedValue : undefined,
          assignedToId: data.assignedToId !== undefined ? data.assignedToId : undefined,
          nextFollowUpAt: data.nextFollowUpAt !== undefined ? data.nextFollowUpAt : undefined,
          lostReason: newStatus === OpportunityStatus.LOST ? data.lostReason : null,
        },
      });

      // 2. Log activity if status changed
      if (originalStatus !== newStatus) {
        await tx.opportunityActivity.create({
          data: {
            opportunityId: id,
            userId,
            type: "STATUS_CHANGED",
            message: `Opportunity status moved from ${originalStatus} to ${newStatus}`,
          },
        });

        // 3. Handle smart follow-up triggers if status is WON
        if (newStatus === OpportunityStatus.WON) {
          await this.triggerSmartFollowUp(tx, updatedOpportunity, userId);
        }
      }

      // 4. Handle manual follow-up creation
      if (data.followUp) {
        const reminder = await tx.reminder.create({
          data: {
            title: data.followUp.title ?? `Follow-up on opportunity`,
            description: data.followUp.description ?? null,
            type: "OPPORTUNITY",
            priority: data.followUp.priority ?? "MEDIUM",
            dueAt: data.followUp.dueAt,
            userId,
            customerId: opportunity.customerId,
            opportunityId: opportunity.id,
          },
        });

        await tx.opportunity.update({
          where: { id },
          data: {
            nextFollowUpAt: reminder.dueAt,
          },
        });

        await tx.opportunityActivity.create({
          data: {
            opportunityId: id,
            userId,
            type: "FOLLOW_UP_SET",
            message: `Follow-up reminder set: ${reminder.title} for ${reminder.dueAt.toLocaleDateString()}`,
          },
        });
      }

      return updatedOpportunity;
    });
  }

  static async triggerSmartFollowUp(
    tx: Prisma.TransactionClient,
    opp: { id: string; customerId: string; category: ProductCategory },
    userId: string
  ) {
    const sequence: ProductCategory[] = [
      ProductCategory.PIPES,
      ProductCategory.WIRES,
      ProductCategory.SWITCHES,
      ProductCategory.LIGHTS,
      ProductCategory.FANS,
    ];

    const currentIndex = sequence.indexOf(opp.category);
    if (currentIndex === -1 || currentIndex === sequence.length - 1) {
      return; // No next sequence category exists
    }

    const nextCategory = sequence[currentIndex + 1];

    // Check if next opportunity category already exists for this customer
    const existing = await tx.opportunity.findFirst({
      where: {
        customerId: opp.customerId,
        category: nextCategory,
      },
    });

    if (existing) {
      return; // Already created, skip automatic recommendation
    }

    // Schedule reminder 30 days in the future
    const delayDays = 30;
    const dueAt = new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000);

    const reminder = await tx.reminder.create({
      data: {
        title: `Suggest ${nextCategory} Opportunity`,
        description: `Customer purchased ${opp.category} 30 days ago. Check if they are ready for ${nextCategory}.`,
        type: "OPPORTUNITY",
        priority: "MEDIUM",
        dueAt,
        userId,
        customerId: opp.customerId,
        opportunityId: opp.id,
      },
    });

    await tx.opportunityActivity.create({
      data: {
        opportunityId: opp.id,
        userId,
        type: "REMINDER_CREATED",
        message: `Smart sequence reminder created for ${nextCategory} in 30 days`,
        metadata: {
          smartReminderId: reminder.id,
          targetCategory: nextCategory,
        },
      },
    });
  }

  static async getStats(userId: string, userRole: UserRole) {
    const where: Prisma.OpportunityWhereInput = {
      isActive: true,
    };

    if (userRole !== UserRole.OWNER) {
      const assignedCats = await this.getAssignedCategories(userId);
      where.OR = [
        { category: { in: assignedCats } },
        { assignedToId: userId },
      ];
    }

    const opportunities = await prisma.opportunity.findMany({ where });

    const stats = {
      total: opportunities.length,
      NEW: 0,
      CONTACTED: 0,
      QUOTATION_SENT: 0,
      NEGOTIATION: 0,
      WON: 0,
      LOST: 0,
      estimatedValue: 0,
    };

    for (const opp of opportunities) {
      stats[opp.status]++;
      if (opp.estimatedValue) {
        stats.estimatedValue += Number(opp.estimatedValue);
      }
    }

    return stats;
  }
}
