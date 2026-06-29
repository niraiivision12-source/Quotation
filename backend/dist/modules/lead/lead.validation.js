"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeadSchema = exports.convertLeadSchema = exports.createLeadSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.createLeadSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    mobile: zod_1.z.string().min(10),
    email: zod_1.z.string().email().optional(),
    source: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    assignedToId: zod_1.z.string().optional(),
});
exports.convertLeadSchema = zod_1.z.object({
    projectName: zod_1.z.string().min(2),
    location: zod_1.z.string().optional(),
    currentPhase: zod_1.z.nativeEnum(client_1.ProjectPhase),
});
exports.updateLeadSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    mobile: zod_1.z.string().min(10).optional(),
    email: zod_1.z.string().email().optional().nullable(),
    source: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
    assignedToId: zod_1.z.string().uuid().optional().nullable(),
    nextFollowUpAt: zod_1.z.string().optional().nullable(),
    city: zod_1.z.string().optional().nullable(),
    status: zod_1.z.nativeEnum(client_1.LeadStatus).optional(),
    reason: zod_1.z.string().optional(),
    followUp: zod_1.z.object({
        title: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().optional(),
        priority: zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        dueAt: zod_1.z.coerce.date(),
    }).optional(),
    followUpDate: zod_1.z.coerce.date().optional(),
});
//# sourceMappingURL=lead.validation.js.map