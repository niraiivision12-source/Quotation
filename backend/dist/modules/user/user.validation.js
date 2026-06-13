"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(client_1.UserRole),
});
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    role: zod_1.z.enum(client_1.UserRole).optional(),
    isActive: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=user.validation.js.map