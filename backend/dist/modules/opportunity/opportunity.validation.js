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
    projectId: zod_1.z.string().uuid().optional().nullable(),
    nextPhase: zod_1.z.nativeEnum(client_1.ProjectPhase).optional().nullable(),
    followUp: zod_1.z.object({
        title: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().optional(),
        priority: zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        dueAt: zod_1.z.coerce.date(),
    }).optional(),
}).refine((data) => {
    if (data.status === "WON" || data.status === "LOST") {
        return !!data.followUp && !!data.followUp.dueAt;
    }
    return true;
}, {
    message: "Follow-up is required when marking an opportunity as Won or Lost",
    path: ["followUp"],
}).refine((data) => {
    if (data.status === "LOST") {
        return !!data.lostReason && data.lostReason.trim().length > 0;
    }
    return true;
}, {
    message: "Lost reason is required when marking an opportunity as Lost",
    path: ["lostReason"],
}).refine((data) => {
    if (data.status === "WON" || data.status === "LOST") {
        return !!data.nextPhase;
    }
    return true;
}, {
    message: "Next phase is required when marking an opportunity as Won or Lost",
    path: ["nextPhase"],
});
//# sourceMappingURL=opportunity.validation.js.map