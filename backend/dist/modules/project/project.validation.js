"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProjectSchema = void 0;
const zod_1 = require("zod");
exports.createProjectSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid(),
    projectName: zod_1.z.string().min(2),
    location: zod_1.z.string().optional(),
    assignedToId: zod_1.z.string().optional(),
    estimatedBudget: zod_1.z.coerce.number().optional(),
});
//# sourceMappingURL=project.validation.js.map