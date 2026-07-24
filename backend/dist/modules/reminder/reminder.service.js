"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
const prisma_1 = require("../../config/prisma");
const app_error_1 = require("../../utils/app-error");
const client_1 = require("@prisma/client");
async function updateOpportunityNextFollowUp(tx, opportunityId) {
    const nextReminder = await tx.reminder.findFirst({
        where: {
            opportunityId,
            status: client_1.ReminderStatus.PENDING,
        },
        orderBy: {
            dueAt: "asc",
        },
    });
    await tx.opportunity.update({
        where: { id: opportunityId },
        data: {
            nextFollowUpAt: nextReminder ? nextReminder.dueAt : null,
        },
    });
}
class ReminderService {
    static async create(userId, data) {
        return prisma_1.prisma.$transaction(async (tx) => {
            if (data.opportunityId) {
                const opp = await tx.opportunity.findUnique({
                    where: { id: data.opportunityId },
                });
                if (opp) {
                    const user = await tx.user.findUnique({ where: { id: userId } });
                    if (user && user.role !== "OWNER") {
                        const settings = await tx.systemSettings.findUnique({ where: { id: "default" } });
                        const mappings = settings?.categorySalesmanAssignment || {};
                        const config = mappings[opp.category];
                        let authorized = false;
                        if (typeof config === "string") {
                            authorized = config === userId;
                        }
                        else if (config && typeof config === "object") {
                            const isPrimary = config.primarySalespersonId === userId;
                            const isBackup = config.backupSalespersonId === userId;
                            const isAdditional = Array.isArray(config.additionalEditors) && config.additionalEditors.includes(userId);
                            authorized = isPrimary || isBackup || isAdditional;
                        }
                        if (opp.assignedToId === userId) {
                            authorized = true;
                        }
                        if (!authorized) {
                            throw new app_error_1.AppError("You do not have permission to manage reminders for this pipeline category", 403);
                        }
                    }
                }
            }
            const reminder = await tx.reminder.create({
                data: {
                    ...data,
                    userId,
                },
            });
            if (data.opportunityId) {
                await updateOpportunityNextFollowUp(tx, data.opportunityId);
                await tx.opportunityActivity.create({
                    data: {
                        opportunityId: data.opportunityId,
                        userId,
                        type: "REMINDER_CREATED",
                        message: `Reminder created: ${reminder.title}`,
                    },
                });
            }
            return reminder;
        });
    }
    static async getMyReminders(userId, userRole, page, limit, opportunityId) {
        const skip = (page - 1) * limit;
        const where = {};
        if (userRole !== "OWNER") {
            where.userId = userId;
        }
        if (opportunityId) {
            where.opportunityId = opportunityId;
        }
        const [items, total] = await Promise.all([
            prisma_1.prisma.reminder.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    dueAt: "asc",
                },
                include: {
                    opportunity: {
                        select: {
                            id: true,
                            category: true,
                        },
                    },
                    customer: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    payment: {
                        select: {
                            id: true,
                            billNumber: true,
                            opportunity: {
                                select: {
                                    category: true,
                                },
                            },
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
            prisma_1.prisma.reminder.count({
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
    static async getOverdue(userId) {
        return prisma_1.prisma.reminder.findMany({
            where: {
                userId,
                status: "PENDING",
                dueAt: {
                    lt: new Date(),
                },
            },
            orderBy: {
                dueAt: "asc",
            },
        });
    }
    static async getById(id, userId, userRole) {
        const where = userRole === "OWNER" ? { id } : { id, userId };
        const reminder = await prisma_1.prisma.reminder.findFirst({
            where,
            include: {
                opportunity: {
                    select: {
                        id: true,
                        category: true,
                    },
                },
                customer: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                payment: {
                    select: {
                        id: true,
                        billNumber: true,
                        opportunity: {
                            select: {
                                category: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        if (!reminder) {
            throw new app_error_1.AppError("Reminder not found", 404);
        }
        return reminder;
    }
    static async update(id, userId, userRole, data) {
        const where = userRole === "OWNER" ? { id } : { id, userId };
        const reminder = await prisma_1.prisma.reminder.findFirst({
            where,
        });
        if (!reminder) {
            throw new app_error_1.AppError("Reminder not found", 404);
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            const updatedReminder = await tx.reminder.update({
                where: { id },
                data,
            });
            if (reminder.opportunityId) {
                await updateOpportunityNextFollowUp(tx, reminder.opportunityId);
            }
            return updatedReminder;
        });
    }
    static async complete(id, userId, userRole) {
        const where = userRole === "OWNER" ? { id } : { id, userId };
        const reminder = await prisma_1.prisma.reminder.findFirst({
            where,
        });
        if (!reminder) {
            throw new app_error_1.AppError("Reminder not found", 404);
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            const updatedReminder = await tx.reminder.update({
                where: { id },
                data: {
                    status: client_1.ReminderStatus.COMPLETED,
                    completedAt: new Date(),
                },
            });
            if (reminder.opportunityId) {
                await updateOpportunityNextFollowUp(tx, reminder.opportunityId);
                await tx.opportunityActivity.create({
                    data: {
                        opportunityId: reminder.opportunityId,
                        userId,
                        type: "REMINDER_COMPLETED",
                        message: `Reminder completed: ${reminder.title}`,
                    },
                });
            }
            return updatedReminder;
        });
    }
    static async delete(id, userId, userRole) {
        const where = userRole === "OWNER" ? { id } : { id, userId };
        const reminder = await prisma_1.prisma.reminder.findFirst({
            where,
        });
        if (!reminder) {
            throw new app_error_1.AppError("Reminder not found", 404);
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            await tx.reminder.delete({
                where: { id },
            });
            if (reminder.opportunityId) {
                await updateOpportunityNextFollowUp(tx, reminder.opportunityId);
            }
            return true;
        });
    }
}
exports.ReminderService = ReminderService;
//# sourceMappingURL=reminder.service.js.map