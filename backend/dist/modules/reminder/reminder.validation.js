"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReminderSchema = exports.createReminderSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.createReminderSchema = zod_1.z.object({
    title: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    type: zod_1.z.enum(client_1.ReminderType),
    priority: zod_1.z.enum(client_1.ReminderPriority),
    dueAt: zod_1.z.coerce.date(),
    repeatType: zod_1.z.enum(client_1.ReminderRepeatType).optional(),
    opportunityId: zod_1.z.uuid().optional(),
    customerId: zod_1.z.uuid().optional(),
    paymentId: zod_1.z.uuid().optional(),
});
exports.updateReminderSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).optional(),
    description: zod_1.z.string().optional().nullable(),
    priority: zod_1.z.enum(client_1.ReminderPriority).optional(),
    status: zod_1.z.enum(client_1.ReminderStatus).optional(),
    dueAt: zod_1.z.coerce.date().optional(),
    repeatType: zod_1.z.enum(client_1.ReminderRepeatType).optional(),
    opportunityId: zod_1.z.uuid().optional().nullable(),
    customerId: zod_1.z.uuid().optional().nullable(),
    paymentId: zod_1.z.uuid().optional().nullable(),
});
//# sourceMappingURL=reminder.validation.js.map