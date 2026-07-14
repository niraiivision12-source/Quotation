"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRevisionSchema = exports.updateQuotationStatusSchema = exports.createQuotationSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const followUpSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).optional(),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    dueAt: zod_1.z.coerce.date(),
}).optional();
exports.createQuotationSchema = zod_1.z.object({
    createdById: zod_1.z.uuid().optional(),
    type: zod_1.z.nativeEnum(client_1.QuotationType).default(client_1.QuotationType.LEAD),
    leadId: zod_1.z.uuid().optional(),
    customerId: zod_1.z.uuid().optional(),
    projectId: zod_1.z.uuid().optional(),
    phase: zod_1.z.nativeEnum(client_1.ProjectPhase).nullable().optional(),
    walkInName: zod_1.z.string().optional(),
    walkInMobile: zod_1.z.string().optional(),
    walkInEmail: zod_1.z.string().nullable().optional(),
    walkInAddress: zod_1.z.string().nullable().optional(),
    notes: zod_1.z.string().optional(),
    validUntil: zod_1.z.coerce.date().optional(),
    discountAmount: zod_1.z.number().min(0).optional(),
    parentQuotationId: zod_1.z.string().uuid().nullable().optional(),
    revisionReason: zod_1.z.nativeEnum(client_1.QuotationRevisionReason).nullable().optional(),
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.uuid(),
        quantity: zod_1.z.number().positive(),
        marginPercent: zod_1.z.number().min(0).optional().nullable(),
        discountPercent: zod_1.z.number().min(0).optional().nullable(),
    })),
    followUp: followUpSchema,
}).superRefine((data, ctx) => {
    if (data.type === client_1.QuotationType.LEAD) {
        if (!data.leadId) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: "Lead ID is required for Lead quotation",
                path: ["leadId"],
            });
        }
    }
    else if (data.type === client_1.QuotationType.CUSTOMER) {
        if (!data.customerId) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: "Customer ID is required for Customer quotation",
                path: ["customerId"],
            });
        }
    }
    else if (data.type === client_1.QuotationType.WALK_IN_CUSTOMER) {
        if (!data.walkInName || !data.walkInName.trim()) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: "Walk-in Customer Name is required",
                path: ["walkInName"],
            });
        }
        if (!data.walkInMobile || !data.walkInMobile.trim()) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: "Walk-in Customer Mobile is required",
                path: ["walkInMobile"],
            });
        }
    }
});
exports.updateQuotationStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(client_1.QuotationStatus),
    followUp: followUpSchema,
});
exports.createRevisionSchema = zod_1.z.object({
    revisionReason: zod_1.z.enum(client_1.QuotationRevisionReason),
});
//# sourceMappingURL=quotation.validation.js.map