"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDealerSchema = exports.createDealerSchema = void 0;
const zod_1 = require("zod");
exports.createDealerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    contactPerson: zod_1.z.string().optional().nullable(),
    mobile: zod_1.z.string().min(10),
    email: zod_1.z.string().email().optional().nullable(),
    address: zod_1.z.string().optional().nullable(),
    gst: zod_1.z.string().optional().nullable(),
    city: zod_1.z.string().optional().nullable(),
    state: zod_1.z.string().optional().nullable(),
});
exports.updateDealerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    contactPerson: zod_1.z.string().optional().nullable(),
    mobile: zod_1.z.string().min(10).optional(),
    email: zod_1.z.string().email().optional().nullable(),
    address: zod_1.z.string().optional().nullable(),
    gst: zod_1.z.string().optional().nullable(),
    city: zod_1.z.string().optional().nullable(),
    state: zod_1.z.string().optional().nullable(),
});
//# sourceMappingURL=dealer.validation.js.map