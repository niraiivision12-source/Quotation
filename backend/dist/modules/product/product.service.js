"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const prisma_1 = require("../../config/prisma");
const app_error_1 = require("../../utils/app-error");
class ProductService {
    static async getAll(page, limit, search) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            prisma_1.prisma.product.findMany({
                where: {
                    isActive: true,
                    ...(search && {
                        OR: [
                            {
                                name: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                            {
                                sku: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                        ],
                    }),
                },
                skip,
                take: limit,
                orderBy: {
                    name: "asc",
                },
            }),
            prisma_1.prisma.product.count({
                where: {
                    isActive: true,
                    ...(search && {
                        OR: [
                            {
                                name: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                            {
                                sku: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                        ],
                    }),
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
    static async create(data) {
        const exists = await prisma_1.prisma.product.findUnique({
            where: {
                sku: data.sku,
            },
        });
        if (exists) {
            throw new app_error_1.AppError("SKU already exists", 409);
        }
        return prisma_1.prisma.product.create({
            data,
        });
    }
    static async getById(id) {
        const product = await prisma_1.prisma.product.findUnique({
            where: {
                id,
                isActive: true,
            },
        });
        if (!product) {
            throw new app_error_1.AppError("Product not found", 404);
        }
        return product;
    }
    static async update(id, data) {
        const product = await prisma_1.prisma.product.findUnique({
            where: { id },
        });
        if (!product) {
            throw new app_error_1.AppError("Product not found", 404);
        }
        return prisma_1.prisma.product.update({
            where: { id },
            data,
        });
    }
    static async deactivate(id) {
        const product = await prisma_1.prisma.product.findUnique({
            where: { id },
        });
        if (!product) {
            throw new app_error_1.AppError("Product not found", 404);
        }
        return prisma_1.prisma.product.update({
            where: { id },
            data: {
                isActive: false,
            },
        });
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=product.service.js.map