"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const prisma_1 = require("@/config/prisma");
const app_error_1 = require("@/utils/app-error");
const client_1 = require("@prisma/client");
class TaskService {
    static async create(createdById, data) {
        const assignedUser = await prisma_1.prisma.user.findUnique({
            where: {
                id: data.assignedToId,
            },
        });
        if (!assignedUser) {
            throw new app_error_1.AppError("Assigned user not found", 404);
        }
        return prisma_1.prisma.task.create({
            data: {
                ...data,
                createdById,
            },
        });
    }
    static async getAll(page, limit, filters, userId, role) {
        const skip = (page - 1) * limit;
        const isOwner = role === client_1.UserRole.OWNER;
        const resolvedAssignedToId = isOwner ? filters.assignedToId : userId;
        const where = {
            ...(filters.status && {
                status: filters.status,
            }),
            ...(filters.priority && {
                priority: filters.priority,
            }),
            ...(resolvedAssignedToId && {
                assignedToId: resolvedAssignedToId,
            }),
            ...(filters.leadId && {
                leadId: filters.leadId,
            }),
            ...(filters.customerId && {
                customerId: filters.customerId,
            }),
            ...(filters.projectId && {
                projectId: filters.projectId,
            }),
            ...(filters.paymentId && {
                paymentId: filters.paymentId,
            }),
            ...(filters.search && {
                OR: [
                    { title: { contains: filters.search, mode: "insensitive" } },
                    { description: { contains: filters.search, mode: "insensitive" } },
                ],
            }),
        };
        const sortBy = filters.sortBy || "createdAt";
        const sortOrder = filters.sortOrder || "desc";
        const [items, total] = await Promise.all([
            prisma_1.prisma.task.findMany({
                where,
                skip,
                take: limit,
                include: {
                    assignedTo: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
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
                },
                orderBy: {
                    [sortBy]: sortOrder,
                },
            }),
            prisma_1.prisma.task.count({
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
    static async getById(id) {
        const task = await prisma_1.prisma.task.findUnique({
            where: { id },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                lead: true,
                customer: true,
                project: true,
            },
        });
        if (!task) {
            throw new app_error_1.AppError("Task not found", 404);
        }
        return task;
    }
    static async update(id, data) {
        const task = await prisma_1.prisma.task.findUnique({
            where: { id },
        });
        if (!task) {
            throw new app_error_1.AppError("Task not found", 404);
        }
        return prisma_1.prisma.task.update({
            where: { id },
            data,
        });
    }
    static async complete(id) {
        const task = await prisma_1.prisma.task.findUnique({
            where: { id },
        });
        if (!task) {
            throw new app_error_1.AppError("Task not found", 404);
        }
        return prisma_1.prisma.task.update({
            where: { id },
            data: {
                status: client_1.TaskStatus.COMPLETED,
                completedAt: new Date(),
            },
        });
    }
    static async cancel(id) {
        const task = await prisma_1.prisma.task.findUnique({
            where: { id },
        });
        if (!task) {
            throw new app_error_1.AppError("Task not found", 404);
        }
        return prisma_1.prisma.task.update({
            where: { id },
            data: {
                status: client_1.TaskStatus.CANCELLED,
            },
        });
    }
    static async delete(id) {
        const task = await prisma_1.prisma.task.findUnique({
            where: { id },
        });
        if (!task) {
            throw new app_error_1.AppError("Task not found", 404);
        }
        return prisma_1.prisma.task.delete({
            where: { id },
        });
    }
}
exports.TaskService = TaskService;
//# sourceMappingURL=task.service.js.map