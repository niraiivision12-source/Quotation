"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealerService = void 0;
const prisma_1 = require("../../config/prisma");
const app_error_1 = require("../../utils/app-error");
class DealerService {
    static async create(data) {
        const exists = await prisma_1.prisma.dealer.findUnique({
            where: {
                mobile: data.mobile,
            },
        });
        if (exists) {
            throw new app_error_1.AppError("Dealer already exists with this mobile number", 409);
        }
        return prisma_1.prisma.dealer.create({
            data: {
                name: data.name,
                contactPerson: data.contactPerson || null,
                mobile: data.mobile,
                email: data.email || null,
                address: data.address || null,
                city: data.city || null,
                state: data.state || null,
                gst: data.gst || null,
            },
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
            prisma_1.prisma.dealer.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma_1.prisma.dealer.count({
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
        const dealer = await prisma_1.prisma.dealer.findUnique({
            where: { id, isActive: true },
            include: {
                purchaseOrders: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        if (!dealer) {
            throw new app_error_1.AppError("Dealer not found", 404);
        }
        return dealer;
    }
    static async update(id, data) {
        const dealer = await prisma_1.prisma.dealer.findUnique({
            where: { id },
        });
        if (!dealer) {
            throw new app_error_1.AppError("Dealer not found", 404);
        }
        if (data.mobile && data.mobile !== dealer.mobile) {
            const exists = await prisma_1.prisma.dealer.findUnique({
                where: {
                    mobile: data.mobile,
                },
            });
            if (exists) {
                throw new app_error_1.AppError("Mobile already exists for another dealer", 409);
            }
        }
        return prisma_1.prisma.dealer.update({
            where: { id },
            data: {
                name: data.name ?? undefined,
                contactPerson: data.contactPerson === undefined ? undefined : data.contactPerson,
                mobile: data.mobile ?? undefined,
                email: data.email === undefined ? undefined : data.email,
                address: data.address === undefined ? undefined : data.address,
                gst: data.gst === undefined ? undefined : data.gst,
                city: data.city === undefined ? undefined : data.city,
                state: data.state === undefined ? undefined : data.state,
            },
        });
    }
    static async deactivate(id) {
        const dealer = await prisma_1.prisma.dealer.findUnique({
            where: { id },
        });
        if (!dealer) {
            throw new app_error_1.AppError("Dealer not found", 404);
        }
        return prisma_1.prisma.dealer.update({
            where: { id },
            data: {
                isActive: false,
            },
        });
    }
}
exports.DealerService = DealerService;
//# sourceMappingURL=dealer.service.js.map