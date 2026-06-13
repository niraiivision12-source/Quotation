"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
const prisma_1 = require("@/config/prisma");
const app_error_1 = require("@/utils/app-error");
const client_1 = require("@prisma/client");
class ReminderService {
    static async create(userId, data) {
        return prisma_1.prisma.reminder.create({
            data: {
                ...data,
                userId,
            },
        });
    }
    static async getMyReminders(userId, page, limit) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            prisma_1.prisma.reminder.findMany({
                where: {
                    userId,
                },
                skip,
                take: limit,
                orderBy: {
                    dueAt: "asc",
                },
            }),
            prisma_1.prisma.reminder.count({
                where: {
                    userId,
                },
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
        return prisma_1.prisma.reminder.update({
            where: { id },
            data,
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
        return prisma_1.prisma.reminder.update({
            where: { id },
            data: {
                status: client_1.ReminderStatus.COMPLETED,
                completedAt: new Date(),
            },
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
        await prisma_1.prisma.reminder.delete({
            where: { id },
        });
        return true;
    }
}
exports.ReminderService = ReminderService;
//# sourceMappingURL=reminder.service.js.map