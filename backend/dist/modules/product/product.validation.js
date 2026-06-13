"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    sku: zod_1.z.string().min(2),
    name: zod_1.z.string().min(2),
    brand: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    unit: zod_1.z.string().optional(),
    costPrice: zod_1.z.coerce.number().positive(),
    stockQty: zod_1.z.coerce.number().int().min(0),
});
exports.updateProductSchema = zod_1.z.object({
    sku: zod_1.z.string().min(2).optional(),
    name: zod_1.z.string().min(2).optional(),
    brand: zod_1.z.string().optional().nullable(),
    category: zod_1.z.string().optional().nullable(),
    unit: zod_1.z.string().optional().nullable(),
    costPrice: zod_1.z.coerce.number().positive().optional(),
    stockQty: zod_1.z.coerce.number().int().min(0).optional(),
});
//# sourceMappingURL=product.validation.js.map