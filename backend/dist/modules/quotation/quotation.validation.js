"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRevisionSchema = exports.updateQuotationStatusSchema = exports.createQuotationSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.createQuotationSchema = zod_1.z.object({
    customerId: zod_1.z.uuid(),
    projectId: zod_1.z.uuid(),
    phase: zod_1.z.enum(client_1.ProjectPhase),
    notes: zod_1.z.string().optional(),
    validUntil: zod_1.z.coerce.date().optional(),
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.uuid(),
        quantity: zod_1.z.number().positive(),
        marginPercent: zod_1.z.number().min(0),
    })),
});
exports.updateQuotationStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(client_1.QuotationStatus),
});
exports.createRevisionSchema = zod_1.z.object({
    revisionReason: zod_1.z.enum(client_1.QuotationRevisionReason),
});
//# sourceMappingURL=quotation.validation.js.map