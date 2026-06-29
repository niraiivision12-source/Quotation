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
    static async getMyReminders(userId, page, limit, projectId) {
        const skip = (page - 1) * limit;
        const where = {
            ...(projectId ? { projectId } : { userId }),
        };
        const [items, total] = await Promise.all([
            prisma_1.prisma.reminder.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    dueAt: "asc",
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
    static async getById(id, userId) {
        const reminder = await prisma_1.prisma.reminder.findFirst({
            where: {
                id,
                userId,
            },
        });
        if (!reminder) {
            throw new app_error_1.AppError("Reminder not found", 404);
        }
        return reminder;
    }
    static async update(id, userId, data) {
        const reminder = await prisma_1.prisma.reminder.findFirst({
            where: {
                id,
                userId,
            },
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
    static async complete(id, userId) {
        const reminder = await prisma_1.prisma.reminder.findFirst({
            where: {
                id,
                userId,
            },
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
    static async delete(id, userId) {
        const reminder = await prisma_1.prisma.reminder.findFirst({
            where: {
                id,
                userId,
            },
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