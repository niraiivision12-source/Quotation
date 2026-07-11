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
                projects: {
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });
        if (!customer) {
            throw new app_error_1.AppError("Customer not found", 404);
        }
        return customer;
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