"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
const prisma_1 = require("@/config/prisma");
const app_error_1 = require("@/utils/app-error");
const client_1 = require("@prisma/client");
async function updateLeadNextFollowUp(tx, leadId) {
    const nextReminder = await tx.reminder.findFirst({
        where: {
            leadId,
            status: client_1.ReminderStatus.PENDING,
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
class ReminderService {
    static async create(userId, data) {
        return prisma_1.prisma.$transaction(async (tx) => {
            const reminder = await tx.reminder.create({
                data: {
                    ...data,
                    userId,
                },
            });
            if (data.leadId) {
                await updateLeadNextFollowUp(tx, data.leadId);
                await tx.leadActivity.create({
                    data: {
                        leadId: data.leadId,
                        userId,
                        type: "REMINDER_CREATED",
                        message: `Reminder created: ${reminder.title}`,
                    },
                });
            }
            if (data.projectId) {
                await tx.projectActivity.create({
                    data: {
                        projectId: data.projectId,
                        userId,
                        type: "REMINDER_CREATED",
                        message: `Reminder created: ${reminder.title}`,
                    },
                });
            }
            return reminder;
        });
    }
    static async getMyReminders(userId, userRole, page, limit, projectId) {
        const skip = (page - 1) * limit;
        const where = {};
        if (userRole !== "OWNER") {
            where.userId = userId;
        }
        if (projectId) {
            where.projectId = projectId;
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
                    lead: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    customer: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    project: {
                        select: {
                            id: true,
                            projectName: true,
                        },
                    },
                    payment: {
                        select: {
                            id: true,
                            billNumber: true,
                            project: {
                                select: {
                                    projectName: true,
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
                lead: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                customer: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        projectName: true,
                    },
                },
                payment: {
                    select: {
                        id: true,
                        billNumber: true,
                        project: {
                            select: {
                                projectName: true,
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
            if (reminder.leadId) {
                await updateLeadNextFollowUp(tx, reminder.leadId);
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
            if (reminder.leadId) {
                await updateLeadNextFollowUp(tx, reminder.leadId);
                await tx.leadActivity.create({
                    data: {
                        leadId: reminder.leadId,
                        userId,
                        type: "REMINDER_COMPLETED",
                        message: `Reminder completed: ${reminder.title}`,
                    },
                });
            }
            if (reminder.projectId) {
                await tx.projectActivity.create({
                    data: {
                        projectId: reminder.projectId,
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
            if (reminder.leadId) {
                await updateLeadNextFollowUp(tx, reminder.leadId);
            }
            return true;
        });
    }
}
exports.ReminderService = ReminderService;
//# sourceMappingURL=reminder.service.js.map