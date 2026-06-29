"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectPhaseSchema = exports.updateProjectSchema = exports.createProjectSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.createProjectSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid(),
    projectName: zod_1.z.string().min(2),
    location: zod_1.z.string().optional(),
    assignedToId: zod_1.z.string().optional(),
    estimatedBudget: zod_1.z.coerce.number().optional(),
    currentPhase: zod_1.z.nativeEnum(client_1.ProjectPhase).optional(),
});
exports.updateProjectSchema = zod_1.z.object({
    projectName: zod_1.z.string().min(2).optional(),
    location: zod_1.z.string().optional().nullable(),
    assignedToId: zod_1.z.string().uuid().optional().nullable(),
    estimatedBudget: zod_1.z.coerce.number().optional(),
    isCompleted: zod_1.z.boolean().optional(),
    status: zod_1.z.nativeEnum(client_1.ProjectStatus).optional(),
    startDate: zod_1.z.coerce.date().optional().nullable(),
    expectedCompletion: zod_1.z.coerce.date().optional().nullable(),
});
exports.updateProjectPhaseSchema = zod_1.z.object({
    phase: zod_1.z.nativeEnum(client_1.ProjectPhase),
});
//# sourceMappingURL=project.validation.js.map