"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLeadSchema = exports.createLeadSchema = void 0;
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
//# sourceMappingURL=lead.validation.js.map