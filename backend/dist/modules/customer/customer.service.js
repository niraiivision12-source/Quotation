"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const prisma_1 = require("../../config/prisma");
const app_error_1 = require("../../utils/app-error");
class CustomerService {
    static async create(data) {
        const exists = await prisma_1.prisma.customer.findUnique({
            where: {
                mobile: data.mobile,
            },
        });
        if (exists) {
            throw new app_error_1.AppError("Customer already exists", 409);
        }
        return prisma_1.prisma.customer.create({
            data,
        });
    }
    static async getAll(page, limit, search) {
        const skip = (page - 1) * limit;
        const where = search
            ? {
                isActive: true,
                OR: [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        mobile: {
                            contains: search,
                        },
                    },
                ],
            }
            : { isActive: true };
        const [items, total] = await Promise.all([
            prisma_1.prisma.customer.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma_1.prisma.customer.count({
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
        const customer = await prisma_1.prisma.customer.findUnique({
            where: { id, isActive: true },
            include: {
                opportunities: {
                    include: {
                        assignedTo: {
                            select: { id: true, name: true }
                        },
                        quotations: true,
                        payments: true,
                    },
                    orderBy: { createdAt: "desc" },
                },
                quotations: {
                    orderBy: { createdAt: "desc" },
                },
                payments: {
                    orderBy: { createdAt: "desc" },
                },
                reminders: {
                    orderBy: { dueAt: "asc" },
                },
                tasks: {
                    orderBy: { dueAt: "asc" },
                },
                activities: {
                    orderBy: { createdAt: "desc" },
                },
                assignedTo: {
                    select: { id: true, name: true }
                },
            },
        });
        if (!customer) {
            throw new app_error_1.AppError("Customer not found", 404);
        }
        // Compute overview metrics
        const outstandingAmount = customer.payments
            .filter((p) => p.status !== "CANCELLED")
            .reduce((sum, p) => sum + Number(p.pendingAmount), 0);
        const totalRevenue = customer.payments
            .filter((p) => p.status !== "CANCELLED")
            .reduce((sum, p) => sum + Number(p.totalBillAmount), 0);
        const lastPurchase = customer.payments.length > 0 ? customer.payments[0].billDate : null;
        const lastContact = customer.activities.length > 0 ? customer.activities[0].createdAt : customer.createdAt;
        return {
            ...customer,
            outstandingAmount,
            totalRevenue,
            lastPurchase,
            lastContact,
        };
    }
    static async update(id, data) {
        const customer = await prisma_1.prisma.customer.findUnique({
            where: { id },
        });
        if (!customer) {
            throw new app_error_1.AppError("Customer not found", 404);
        }
        if (data.mobile && data.mobile !== customer.mobile) {
            const exists = await prisma_1.prisma.customer.findUnique({
                where: {
                    mobile: data.mobile,
                },
            });
            if (exists) {
                throw new app_error_1.AppError("Mobile already exists", 409);
            }
        }
        return prisma_1.prisma.customer.update({
            where: { id },
            data,
        });
    }
    static async deactivate(id) {
        const customer = await prisma_1.prisma.customer.findUnique({
            where: { id },
        });
        if (!customer) {
            throw new app_error_1.AppError("Customer not found", 404);
        }
        return prisma_1.prisma.customer.update({
            where: { id },
            data: {
                isActive: false,
            },
        });
    }
}
exports.CustomerService = CustomerService;
//# sourceMappingURL=customer.service.js.map