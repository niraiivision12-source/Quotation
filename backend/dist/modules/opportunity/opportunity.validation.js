"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOpportunitySchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.updateOpportunitySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.OpportunityStatus).optional(),
    estimatedValue: zod_1.z.number().optional().nullable(),
    assignedToId: zod_1.z.string().uuid().optional().nullable(),
    nextFollowUpAt: zod_1.z.coerce.date().optional().nullable(),
    lostReason: zod_1.z.string().optional().nullable(),
    followUp: zod_1.z.object({
        title: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().optional(),
        priority: zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        dueAt: zod_1.z.coerce.date(),
    }).optional(),
});
//# sourceMappingURL=opportunity.validation.js.map