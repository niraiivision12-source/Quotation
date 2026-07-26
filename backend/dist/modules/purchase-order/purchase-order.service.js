"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderService = void 0;
const prisma_1 = require("../../config/prisma");
const app_error_1 = require("../../utils/app-error");
const settings_service_1 = require("../settings/settings.service");
const client_1 = require("@prisma/client");
class PurchaseOrderService {
    static async create(data, userId) {
        const dealer = await prisma_1.prisma.dealer.findUnique({
            where: { id: data.dealerId, isActive: true },
        });
        if (!dealer) {
            throw new app_error_1.AppError("Dealer not found or inactive", 404);
        }
        if (data.items.length === 0) {
            throw new app_error_1.AppError("Purchase order must contain at least one item", 400);
        }
        // Verify all products
        for (const item of data.items) {
            if (item.quantity <= 0) {
                throw new app_error_1.AppError("Invalid quantity, must be positive", 400);
            }
            const product = await prisma_1.prisma.product.findUnique({
                where: { id: item.productId },
            });
            if (!product) {
                throw new app_error_1.AppError(`Product not found: ${item.productId}`, 404);
            }
            if (!product.isActive) {
                throw new app_error_1.AppError(`Product is inactive: ${product.name}`, 400);
            }
        }
        const settings = await settings_service_1.SettingsService.getSettings();
        const lastPO = data.parentPurchaseOrderId
            ? null
            : await prisma_1.prisma.purchaseOrder.findFirst({
                where: { dealerId: data.dealerId },
                orderBy: { version: "desc" },
            });
        const version = lastPO ? lastPO.version + 1 : 1;
        return prisma_1.prisma.$transaction(async (tx) => {
            const totalPOs = await tx.purchaseOrder.count();
            const seq = totalPOs + 1;
            const now = new Date();
            const yyyy = String(now.getFullYear());
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            // Generate a unique sequential PO Number, e.g. PO-2026-001
            const poNumber = `PO-${yyyy}-${mm}-${String(seq).padStart(3, "0")}`;
            const newPO = await tx.purchaseOrder.create({
                data: {
                    poNumber,
                    dealerId: data.dealerId,
                    poDate: now,
                    expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
                    deliveryAddress: data.deliveryAddress || null,
                    notes: data.notes || null,
                    status: client_1.PurchaseOrderStatus.DRAFT,
                    version,
                    parentPurchaseOrderId: data.parentPurchaseOrderId || null,
                    createdById: userId,
                    dealerNameSnapshot: dealer.name,
                    dealerContactPersonSnapshot: dealer.contactPerson,
                    dealerMobileSnapshot: dealer.mobile,
                    dealerEmailSnapshot: dealer.email,
                    dealerAddressSnapshot: dealer.address,
                    dealerGstSnapshot: dealer.gst,
                    companyNameSnapshot: settings.companyName,
                    companyLogoSnapshot: settings.companyLogo,
                    companyGstSnapshot: settings.companyGst,
                    companyAddressSnapshot: settings.companyAddress,
                    companyPhoneSnapshot: settings.companyPhone,
                    companyEmailSnapshot: settings.companyEmail,
                    companyWebsiteSnapshot: settings.companyWebsite,
                    authorizedSignatureSnapshot: settings.authorizedSignature,
                    items: {
                        create: data.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                        })),
                    },
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    dealer: true,
                },
            });
            return newPO;
        });
    }
    static async getAll(page, limit, search) {
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                {
                    poNumber: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    dealerNameSnapshot: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    dealer: {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                },
            ];
        }
        const [items, total] = await Promise.all([
            prisma_1.prisma.purchaseOrder.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    dealer: true,
                    createdBy: {
                        select: { id: true, name: true },
                    },
                },
            }),
            prisma_1.prisma.purchaseOrder.count({
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
        const po = await prisma_1.prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                dealer: true,
                createdBy: {
                    select: { id: true, name: true, role: true },
                },
            },
        });
        if (!po) {
            throw new app_error_1.AppError("Purchase Order not found", 404);
        }
        return po;
    }
    static async updateStatus(id, status) {
        const po = await prisma_1.prisma.purchaseOrder.findUnique({
            where: { id },
        });
        if (!po) {
            throw new app_error_1.AppError("Purchase Order not found", 404);
        }
        return prisma_1.prisma.purchaseOrder.update({
            where: { id },
            data: { status },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                dealer: true,
            },
        });
    }
    static async createRevision(poId, userId, revisionReason) {
        const po = await prisma_1.prisma.purchaseOrder.findUnique({
            where: { id: poId },
            include: {
                items: true,
            },
        });
        if (!po) {
            throw new app_error_1.AppError("Purchase Order not found", 404);
        }
        // Check if revision already spawned from this version
        const childVersion = await prisma_1.prisma.purchaseOrder.findFirst({
            where: {
                parentPurchaseOrderId: po.id,
            },
        });
        if (childVersion) {
            throw new app_error_1.AppError("Revision already exists. Create revision from the latest version.", 400);
        }
        if (po.status === client_1.PurchaseOrderStatus.DRAFT) {
            throw new app_error_1.AppError("Draft Purchase Order cannot be revised", 400);
        }
        const latestVersion = await prisma_1.prisma.purchaseOrder.findFirst({
            where: {
                dealerId: po.dealerId,
            },
            orderBy: {
                version: "desc",
            },
        });
        const version = latestVersion ? latestVersion.version + 1 : po.version + 1;
        const payload = {
            dealerId: po.dealerId,
            expectedDeliveryDate: po.expectedDeliveryDate || undefined,
            deliveryAddress: po.deliveryAddress || undefined,
            notes: po.notes || undefined,
            parentPurchaseOrderId: po.id,
            revisionReason,
            items: po.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
            })),
        };
        return this.create(payload, userId);
    }
    static async getHistory(id) {
        const po = await prisma_1.prisma.purchaseOrder.findUnique({
            where: { id },
            select: { id: true, parentPurchaseOrderId: true },
        });
        if (!po) {
            throw new app_error_1.AppError("Purchase Order not found", 404);
        }
        // Walk up to the root parent
        const seen = new Set([po.id]);
        let root = po;
        while (root.parentPurchaseOrderId && !seen.has(root.parentPurchaseOrderId)) {
            const parent = await prisma_1.prisma.purchaseOrder.findUnique({
                where: { id: root.parentPurchaseOrderId },
                select: { id: true, parentPurchaseOrderId: true },
            });
            if (!parent)
                break;
            seen.add(parent.id);
            root = parent;
        }
        // Collect all descendents level by level
        const chainIds = [root.id];
        let frontier = [root.id];
        while (frontier.length > 0) {
            const children = await prisma_1.prisma.purchaseOrder.findMany({
                where: { parentPurchaseOrderId: { in: frontier } },
                select: { id: true },
            });
            frontier = children
                .map((child) => child.id)
                .filter((childId) => !chainIds.includes(childId));
            chainIds.push(...frontier);
        }
        return prisma_1.prisma.purchaseOrder.findMany({
            where: { id: { in: chainIds } },
            orderBy: { version: "asc" },
            include: {
                createdBy: {
                    select: { id: true, name: true },
                },
            },
        });
    }
    static async update(id, data) {
        const po = await prisma_1.prisma.purchaseOrder.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!po) {
            throw new app_error_1.AppError("Purchase Order not found", 404);
        }
        let dealerUpdate = {};
        if (data.dealerId && data.dealerId !== po.dealerId) {
            const dealer = await prisma_1.prisma.dealer.findUnique({
                where: { id: data.dealerId, isActive: true },
            });
            if (!dealer) {
                throw new app_error_1.AppError("Dealer not found or inactive", 404);
            }
            dealerUpdate = {
                dealerId: data.dealerId,
                dealerNameSnapshot: dealer.name,
                dealerContactPersonSnapshot: dealer.contactPerson,
                dealerMobileSnapshot: dealer.mobile,
                dealerEmailSnapshot: dealer.email,
                dealerAddressSnapshot: dealer.address,
                dealerGstSnapshot: dealer.gst,
            };
        }
        if (data.items) {
            for (const item of data.items) {
                if (item.quantity <= 0) {
                    throw new app_error_1.AppError("Invalid quantity, must be positive", 400);
                }
                const product = await prisma_1.prisma.product.findUnique({
                    where: { id: item.productId },
                });
                if (!product) {
                    throw new app_error_1.AppError(`Product not found: ${item.productId}`, 404);
                }
                if (!product.isActive) {
                    throw new app_error_1.AppError(`Product is inactive: ${product.name}`, 400);
                }
            }
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            if (data.items) {
                await tx.purchaseOrderItem.deleteMany({
                    where: { purchaseOrderId: id },
                });
            }
            const updatedPo = await tx.purchaseOrder.update({
                where: { id },
                data: {
                    ...dealerUpdate,
                    expectedDeliveryDate: data.expectedDeliveryDate === undefined ? undefined : (data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null),
                    deliveryAddress: data.deliveryAddress === undefined ? undefined : data.deliveryAddress,
                    notes: data.notes === undefined ? undefined : data.notes,
                    items: data.items
                        ? {
                            create: data.items.map((item) => ({
                                productId: item.productId,
                                quantity: item.quantity,
                            })),
                        }
                        : undefined,
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    dealer: true,
                },
            });
            return updatedPo;
        });
    }
    static async delete(id) {
        const po = await prisma_1.prisma.purchaseOrder.findUnique({
            where: { id },
        });
        if (!po) {
            throw new app_error_1.AppError("Purchase Order not found", 404);
        }
        return prisma_1.prisma.purchaseOrder.delete({
            where: { id },
        });
    }
}
exports.PurchaseOrderService = PurchaseOrderService;
//# sourceMappingURL=purchase-order.service.js.map