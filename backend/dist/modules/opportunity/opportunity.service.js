"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpportunityService = void 0;
const prisma_1 = require("../../config/prisma");
const app_error_1 = require("../../utils/app-error");
const client_1 = require("@prisma/client");
class OpportunityService {
    static async getAssignedCategories(userId) {
        const settings = await prisma_1.prisma.systemSettings.findUnique({
            where: { id: "default" },
        });
        const mappings = settings?.categorySalesmanAssignment || {};
        const categories = [];
        for (const [cat, config] of Object.entries(mappings)) {
            if (typeof config === "string") {
                if (config === userId) {
                    categories.push(cat);
                }
            }
            else if (config && typeof config === "object") {
                const isPrimary = config.primarySalespersonId === userId;
                const isBackup = config.backupSalespersonId === userId;
                const isAdditional = Array.isArray(config.additionalEditors) && config.additionalEditors.includes(userId);
                if (isPrimary || isBackup || isAdditional) {
                    categories.push(cat);
                }
            }
        }
        return categories;
    }
    static async getAll(userId, userRole, page, limit, search, filters) {
        const skip = (page - 1) * limit;
        const where = {
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
        const items = await prisma_1.prisma.opportunity.findMany({
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
        const overdueItems = [];
        const regularItems = [];
        for (const item of items) {
            const isOverdue = item.nextFollowUpAt &&
                new Date(item.nextFollowUpAt) < now &&
                item.status !== client_1.OpportunityStatus.WON &&
                item.status !== client_1.OpportunityStatus.LOST;
            if (isOverdue) {
                overdueItems.push(item);
            }
            else {
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
    static async getById(id, userId, userRole) {
        const opportunity = await prisma_1.prisma.opportunity.findUnique({
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
            throw new app_error_1.AppError("Opportunity not found", 404);
        }
        // Validate salesperson visibility
        if (userRole !== client_1.UserRole.OWNER) {
            const assignedCats = await this.getAssignedCategories(userId);
            const isAssignedCat = assignedCats.includes(opportunity.category);
            const isAssignedUser = opportunity.assignedToId === userId;
            if (!isAssignedCat && !isAssignedUser) {
                throw new app_error_1.AppError("You do not have permission to view this opportunity", 403);
            }
        }
        return opportunity;
    }
    static async update(id, userId, userRole, data) {
        const opportunity = await prisma_1.prisma.opportunity.findUnique({
            where: { id },
        });
        if (!opportunity) {
            throw new app_error_1.AppError("Opportunity not found", 404);
        }
        // Validate permissions
        if (userRole !== client_1.UserRole.OWNER) {
            const assignedCats = await this.getAssignedCategories(userId);
            const isAssignedCat = assignedCats.includes(opportunity.category);
            const isAssignedUser = opportunity.assignedToId === userId;
            if (!isAssignedCat && !isAssignedUser) {
                throw new app_error_1.AppError("You do not have permission to edit this opportunity", 403);
            }
        }
        return prisma_1.prisma.$transaction(async (tx) => {
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
                    lostReason: newStatus === client_1.OpportunityStatus.LOST ? data.lostReason : null,
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
                if (newStatus === client_1.OpportunityStatus.WON) {
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
    static async triggerSmartFollowUp(tx, opp, userId) {
        const sequence = [
            client_1.ProductCategory.PIPES,
            client_1.ProductCategory.WIRES,
            client_1.ProductCategory.SWITCHES,
            client_1.ProductCategory.LIGHTS,
            client_1.ProductCategory.FANS,
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
    static async getStats(userId, userRole) {
        const where = {
            isActive: true,
        };
        if (userRole !== client_1.UserRole.OWNER) {
            const assignedCats = await this.getAssignedCategories(userId);
            where.OR = [
                { category: { in: assignedCats } },
                { assignedToId: userId },
            ];
        }
        const opportunities = await prisma_1.prisma.opportunity.findMany({ where });
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
exports.OpportunityService = OpportunityService;
//# sourceMappingURL=opportunity.service.js.map