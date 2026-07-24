"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triageEnquirySchema = exports.createEnquirySchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.createEnquirySchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    mobile: zod_1.z.string().min(10),
    email: zod_1.z.string().email().optional().nullable(),
    source: zod_1.z.string().optional().default("MANUAL"),
    message: zod_1.z.string().optional().nullable(),
});
exports.triageEnquirySchema = zod_1.z.object({
    category: zod_1.z.nativeEnum(client_1.ProductCategory),
});
//# sourceMappingURL=enquiry.validation.js.map