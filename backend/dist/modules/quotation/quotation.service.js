"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationService = void 0;
const prisma_1 = require("@/config/prisma");
const app_error_1 = require("@/utils/app-error");
const client_1 = require("@prisma/client");
class QuotationService {
    static async create(userId, data) {
        const project = await prisma_1.prisma.project.findUnique({
            where: {
                id: data.projectId,
            },
            include: {
                customer: true,
            },
        });
        if (!project) {
            throw new app_error_1.AppError("Project not found", 404);
        }
        if (project.customerId !== data.customerId) {
            throw new app_error_1.AppError("Project does not belong to customer", 400);
        }
        const lastQuotation = await prisma_1.prisma.quotation.findFirst({
            where: {
                projectId: data.projectId,
                phase: data.phase,
            },
            orderBy: {
                version: "desc",
            },
        });
        const version = lastQuotation ? lastQuotation.version + 1 : 1;
        const quotationNumber = `QT-${Date.now()}`;
        let subtotal = 0;
        const itemData = [];
        for (const item of data.items) {
            if (item.quantity <= 0) {
                throw new app_error_1.AppError("Invalid quantity", 400);
            }
            const product = await prisma_1.prisma.product.findUnique({
                where: {
                    id: item.productId,
                },
            });
            if (!product) {
                throw new app_error_1.AppError("Product not found", 404);
            }
            if (!product.isActive) {
                throw new app_error_1.AppError("Product is inactive", 400);
            }
            const costPrice = Number(product.costPrice);
            const sellingPrice = costPrice + (costPrice * item.marginPercent) / 100;
            const totalPrice = sellingPrice * item.quantity;
            subtotal += totalPrice;
            itemData.push({
                productId: product.id,
                quantity: item.quantity,
                costPrice,
                marginPercent: item.marginPercent,
                sellingPrice,
                totalPrice,
            });
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            const quotation = await tx.quotation.create({
                data: {
                    quotationNumber,
                    customerId: data.customerId,
                    projectId: data.projectId,
                    phase: data.phase,
                    version,
                    subtotal,
                    totalAmount: subtotal,
                    notes: data.notes,
                    validUntil: data.validUntil,
                    createdById: userId,
                    parentQuotationId: lastQuotation?.id,
                    items: {
                        create: itemData,
                    },
                },
                include: {
                    items: true,
                },
            });
            return quotation;
        });
    }
    static async getAll(page, limit, projectId, customerId) {
        const skip = (page - 1) * limit;
        const where = {
            ...(projectId && {
                projectId,
            }),
            ...(customerId && {
                customerId,
            }),
        };
        const [items, total] = await Promise.all([
            prisma_1.prisma.quotation.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    quotationNumber: true,
                    phase: true,
                    version: true,
                    status: true,
                    totalAmount: true,
                    createdAt: true,
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            mobile: true,
                        },
                    },
                    project: {
                        select: {
                            id: true,
                            projectName: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma_1.prisma.quotation.count({
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
        const quotation = await prisma_1.prisma.quotation.findUnique({
            where: {
                id,
            },
            include: {
                customer: true,
                project: true,
                createdBy: true,
                items: {
                    include: {
                        product: true,
                    },
                },
                childVersions: true,
                parentQuotation: true,
            },
        });
        if (!quotation) {
            throw new app_error_1.AppError("Quotation not found", 404);
        }
        return quotation;
    }
    static async getProjectQuotations(projectId) {
        return prisma_1.prisma.quotation.findMany({
            where: {
                projectId,
            },
            orderBy: [
                {
                    phase: "asc",
                },
                {
                    version: "desc",
                },
            ],
        });
    }
    static async updateStatus(id, status) {
        const quotation = await prisma_1.prisma.quotation.findUnique({
            where: {
                id,
            },
        });
        if (!quotation) {
            throw new app_error_1.AppError("Quotation not found", 404);
        }
        const transitions = {
            DRAFT: [client_1.QuotationStatus.SENT],
            SENT: [
                client_1.QuotationStatus.APPROVED,
                client_1.QuotationStatus.REJECTED,
                client_1.QuotationStatus.EXPIRED,
            ],
            APPROVED: [],
            REJECTED: [],
            EXPIRED: [],
        };
        const allowed = transitions[quotation.status];
        if (!allowed.includes(status)) {
            throw new app_error_1.AppError(`Cannot move quotation from ${quotation.status} to ${status}`, 400);
        }
        return prisma_1.prisma.quotation.update({
            where: {
                id,
            },
            data: {
                status,
                approvedAt: status === client_1.QuotationStatus.APPROVED ? new Date() : null,
                rejectedAt: status === client_1.QuotationStatus.REJECTED ? new Date() : null,
            },
        });
    }
    static async createRevision(quotationId, userId, revisionReason) {
        const quotation = await prisma_1.prisma.quotation.findUnique({
            where: {
                id: quotationId,
            },
            include: {
                items: true,
            },
        });
        if (!quotation) {
            throw new app_error_1.AppError("Quotation not found", 404);
        }
        const childVersion = await prisma_1.prisma.quotation.findFirst({
            where: {
                parentQuotationId: quotation.id,
            },
        });
        if (childVersion) {
            throw new app_error_1.AppError("Revision already exists. Create revision from latest version.", 400);
        }
        if (quotation.status === "DRAFT") {
            throw new app_error_1.AppError("Draft quotation cannot be revised", 400);
        }
        if (quotation.status === "APPROVED") {
            throw new app_error_1.AppError("Approved quotation cannot be revised", 400);
        }
        const latestVersion = await prisma_1.prisma.quotation.findFirst({
            where: {
                projectId: quotation.projectId,
                phase: quotation.phase,
            },
            orderBy: {
                version: "desc",
            },
        });
        const version = latestVersion ? latestVersion.version + 1 : 1;
        return prisma_1.prisma.$transaction(async (tx) => {
            const newQuotation = await tx.quotation.create({
                data: {
                    quotationNumber: `QT-${Date.now()}`,
                    customerId: quotation.customerId,
                    projectId: quotation.projectId,
                    phase: quotation.phase,
                    version,
                    status: "DRAFT",
                    subtotal: quotation.subtotal,
                    discountAmount: quotation.discountAmount,
                    totalAmount: quotation.totalAmount,
                    notes: quotation.notes,
                    validUntil: quotation.validUntil,
                    parentQuotationId: quotation.id,
                    revisionReason,
                    createdById: userId,
                },
            });
            await tx.quotationItem.createMany({
                data: quotation.items.map((item) => ({
                    quotationId: newQuotation.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    costPrice: item.costPrice,
                    marginPercent: item.marginPercent,
                    sellingPrice: item.sellingPrice,
                    totalPrice: item.totalPrice,
                })),
            });
            return newQuotation;
        });
    }
}
exports.QuotationService = QuotationService;
//# sourceMappingURL=quotation.service.js.map