"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePurchaseOrderSchema = exports.createPurchaseOrderRevisionSchema = exports.updatePurchaseOrderStatusSchema = exports.createPurchaseOrderSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createPurchaseOrderSchema = zod_1.z.object({
    dealerId: zod_1.z.string().uuid(),
    expectedDeliveryDate: zod_1.z.coerce.date().optional().nullable(),
    deliveryAddress: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
    createdById: zod_1.z.string().uuid().optional(),
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string().uuid(),
        quantity: zod_1.z.number().positive(),
    })).min(1),
    parentPurchaseOrderId: zod_1.z.string().uuid().optional().nullable(),
    revisionReason: zod_1.z.string().optional().nullable(),
});
exports.updatePurchaseOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.PurchaseOrderStatus),
});
exports.createPurchaseOrderRevisionSchema = zod_1.z.object({
    revisionReason: zod_1.z.string().min(2),
});
exports.updatePurchaseOrderSchema = zod_1.z.object({
    dealerId: zod_1.z.string().uuid().optional(),
    expectedDeliveryDate: zod_1.z.coerce.date().optional().nullable(),
    deliveryAddress: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string().uuid(),
        quantity: zod_1.z.number().positive(),
    })).min(1).optional(),
});
//# sourceMappingURL=purchase-order.validation.js.map