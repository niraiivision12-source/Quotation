"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncProductsPayloadSchema = exports.syncUnitsPayloadSchema = exports.syncStockGroupsPayloadSchema = exports.syncProductSchema = exports.syncUnitSchema = exports.syncStockGroupSchema = void 0;
const zod_1 = require("zod");
exports.syncStockGroupSchema = zod_1.z.object({
    tallyMasterId: zod_1.z.string(),
    tallyGuid: zod_1.z.string().optional().nullable(),
    tallyAlterId: zod_1.z.number().optional().nullable(),
    name: zod_1.z.string(),
    parentName: zod_1.z.string().optional().nullable(),
    isActive: zod_1.z.boolean().optional().default(true)
});
exports.syncUnitSchema = zod_1.z.object({
    tallyMasterId: zod_1.z.string(),
    tallyGuid: zod_1.z.string().optional().nullable(),
    tallyAlterId: zod_1.z.number().optional().nullable(),
    name: zod_1.z.string(),
    symbol: zod_1.z.string(),
    isActive: zod_1.z.boolean().optional().default(true)
});
exports.syncProductSchema = zod_1.z.object({
    tallyMasterId: zod_1.z.string(),
    tallyGuid: zod_1.z.string().optional().nullable(),
    tallyAlterId: zod_1.z.number().optional().nullable(),
    stockGroupId: zod_1.z.string().optional().nullable(),
    unitId: zod_1.z.string().optional().nullable(),
    // Necessary fields for product creation if it's new
    sku: zod_1.z.string(),
    name: zod_1.z.string(),
    brand: zod_1.z.string().optional().nullable(),
    category: zod_1.z.string().optional().nullable(),
    costPrice: zod_1.z.number(),
    stockQty: zod_1.z.number().optional().default(0),
    tallyStockQty: zod_1.z.number().optional().default(0),
    isActive: zod_1.z.boolean().optional().default(true)
});
exports.syncStockGroupsPayloadSchema = zod_1.z.array(exports.syncStockGroupSchema);
exports.syncUnitsPayloadSchema = zod_1.z.array(exports.syncUnitSchema);
exports.syncProductsPayloadSchema = zod_1.z.array(exports.syncProductSchema);
//# sourceMappingURL=sync.validation.js.map