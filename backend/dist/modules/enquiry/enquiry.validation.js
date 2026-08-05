"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkActionSchema = exports.updateEnquirySchema = exports.triageEnquirySchema = exports.createEnquirySchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.createEnquirySchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    mobile: zod_1.z.string().min(10),
    email: zod_1.z.string().email().optional().nullable(),
    source: zod_1.z.string().optional().default("MANUAL"),
    message: zod_1.z.string().optional().nullable(),
    city: zod_1.z.string().optional().nullable(),
});
exports.triageEnquirySchema = zod_1.z.object({
    category: zod_1.z.nativeEnum(client_1.ProductCategory),
    notes: zod_1.z.string().optional().nullable(),
    projectName: zod_1.z.string().optional().nullable(),
});
exports.updateEnquirySchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    email: zod_1.z.string().email().optional().nullable(),
    city: zod_1.z.string().optional().nullable(),
    message: zod_1.z.string().optional().nullable(),
    source: zod_1.z.string().optional(),
});
exports.bulkActionSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().uuid()).min(1, "At least one ID is required"),
});
//# sourceMappingURL=enquiry.validation.js.map