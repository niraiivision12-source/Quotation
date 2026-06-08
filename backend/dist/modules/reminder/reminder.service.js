"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
const prisma_1 = require("@/config/prisma");
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
}
exports.ReminderService = ReminderService;
//# sourceMappingURL=reminder.service.js.map