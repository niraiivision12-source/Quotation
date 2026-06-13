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
    assignedToId: zod_1.z.string().optional(),
});
exports.convertLeadSchema = zod_1.z.object({
    projectName: zod_1.z.string().min(2),
    location: zod_1.z.string().optional(),
    estimatedBudget: zod_1.z.coerce.number().optional(),
});
exports.updateLeadSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    mobile: zod_1.z.string().min(10).optional(),
    email: zod_1.z.string().email().optional().nullable(),
    source: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
    assignedToId: zod_1.z.string().uuid().optional().nullable(),
    status: zod_1.z.enum(client_1.LeadStatus).optional(),
});
//# sourceMappingURL=lead.validation.js.map