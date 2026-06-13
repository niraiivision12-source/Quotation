"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskSchema = exports.createTaskSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.enum(client_1.TaskPriority),
    dueAt: zod_1.z.coerce.date().optional(),
    assignedToId: zod_1.z.uuid(),
    leadId: zod_1.z.uuid().optional(),
    customerId: zod_1.z.uuid().optional(),
    projectId: zod_1.z.uuid().optional(),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).optional(),
    description: zod_1.z.string().optional().nullable(),
    priority: zod_1.z.enum(client_1.TaskPriority).optional(),
    status: zod_1.z.enum(client_1.TaskStatus).optional(),
    dueAt: zod_1.z.coerce.date().optional(),
    assignedToId: zod_1.z.uuid().optional(),
    leadId: zod_1.z.uuid().optional().nullable(),
    customerId: zod_1.z.uuid().optional().nullable(),
    projectId: zod_1.z.uuid().optional().nullable(),
});
//# sourceMappingURL=task.validation.js.map