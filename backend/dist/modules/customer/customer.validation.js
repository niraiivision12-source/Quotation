"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomerSchema = void 0;
const zod_1 = require("zod");
exports.createCustomerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    mobile: zod_1.z.string().min(10),
    email: zod_1.z.string().email().optional(),
    address: zod_1.z.string().optional(),
    assignedToId: zod_1.z.string().optional(),
});
//# sourceMappingURL=customer.validation.js.map