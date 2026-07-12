"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncService = exports.SyncService = void 0;
const prisma_1 = require("../../lib/prisma");
const sync_validation_1 = require("./sync.validation");
class SyncService {
    async syncStockGroups(data) {
        const parsed = sync_validation_1.syncStockGroupsPayloadSchema.parse(data);
        let inserted = 0;
        let updated = 0;
        let attached = 0;
        let failed = 0;
        await prisma_1.prisma.$transaction(async (tx) => {
            for (const group of parsed) {
                try {
                    const existing = await tx.stockGroup.findUnique({
                        where: { tallyMasterId: group.tallyMasterId }
                    });
                    if (existing) {
                        await tx.stockGroup.update({
                            where: { id: existing.id },
                            data: {
                                tallyGuid: group.tallyGuid,
                                tallyAlterId: group.tallyAlterId,
                                name: group.name,
                                parentName: group.parentName,
                                isActive: group.isActive,
                            }
                        });
                        updated++;
                    }
                    else {
                        await tx.stockGroup.create({
                            data: {
                                tallyMasterId: group.tallyMasterId,
                                tallyGuid: group.tallyGuid,
                                tallyAlterId: group.tallyAlterId,
                                name: group.name,
                                parentName: group.parentName,
                                isActive: group.isActive,
                            }
                        });
                        inserted++;
                    }
                }
                catch (error) {
                    failed++;
                }
            }
        });
        return {
            success: true,
            message: "Processed successfully",
            count: inserted + updated + attached,
            inserted,
            updated,
            attached,
            failed
        };
    }
    async syncUnits(data) {
        const parsed = sync_validation_1.syncUnitsPayloadSchema.parse(data);
        let inserted = 0;
        let updated = 0;
        let attached = 0;
        let failed = 0;
        await prisma_1.prisma.$transaction(async (tx) => {
            for (const unit of parsed) {
                try {
                    const existing = await tx.unit.findUnique({
                        where: { tallyMasterId: unit.tallyMasterId }
                    });
                    if (existing) {
                        await tx.unit.update({
                            where: { id: existing.id },
                            data: {
                                tallyGuid: unit.tallyGuid,
                                tallyAlterId: unit.tallyAlterId,
                                name: unit.name,
                                symbol: unit.symbol,
                                isActive: unit.isActive,
                            }
                        });
                        updated++;
                    }
                    else {
                        await tx.unit.create({
                            data: {
                                tallyMasterId: unit.tallyMasterId,
                                tallyGuid: unit.tallyGuid,
                                tallyAlterId: unit.tallyAlterId,
                                name: unit.name,
                                symbol: unit.symbol,
                                isActive: unit.isActive,
                            }
                        });
                        inserted++;
                    }
                }
                catch (error) {
                    failed++;
                }
            }
        });
        return {
            success: true,
            message: "Processed successfully",
            count: inserted + updated + attached,
            inserted,
            updated,
            attached,
            failed
        };
    }
    async syncProducts(data) {
        const parsed = sync_validation_1.syncProductsPayloadSchema.parse(data);
        let inserted = 0;
        let updated = 0;
        let attached = 0;
        let failed = 0;
        // Load lookup data once
        const stockGroups = await prisma_1.prisma.stockGroup.findMany({
            select: {
                id: true,
                tallyMasterId: true,
                name: true
            }
        });
        const units = await prisma_1.prisma.unit.findMany({
            select: {
                id: true,
                tallyMasterId: true,
                name: true,
                symbol: true
            }
        });
        const products = await prisma_1.prisma.product.findMany({
            select: {
                id: true,
                tallyMasterId: true,
                sku: true
            }
        });
        // Create lookup maps
        const stockGroupByTallyMap = new Map();
        const stockGroupByNameMap = new Map();
        for (const sg of stockGroups) {
            stockGroupByTallyMap.set(sg.tallyMasterId, sg.tallyMasterId);
            stockGroupByNameMap.set(sg.name, sg.tallyMasterId);
        }
        const unitByTallyMap = new Map();
        const unitByNameMap = new Map();
        const unitBySymbolMap = new Map();
        for (const u of units) {
            unitByTallyMap.set(u.tallyMasterId, u.tallyMasterId);
            unitByNameMap.set(u.name, u.tallyMasterId);
            unitBySymbolMap.set(u.symbol, u.tallyMasterId);
        }
        let productByTallyMap = new Map();
        let productBySkuMap = new Map();
        for (const p of products) {
            if (p.tallyMasterId) {
                productByTallyMap.set(p.tallyMasterId, p);
            }
            if (p.sku) {
                productBySkuMap.set(p.sku, p);
            }
        }
        // Helper to process a single product inside a transaction
        const processSingleProduct = async (tx, product) => {
            // Resolve stockGroupId using lookup Maps
            let resolvedStockGroupId = null;
            if (product.stockGroupId) {
                resolvedStockGroupId = stockGroupByTallyMap.get(product.stockGroupId) ||
                    stockGroupByNameMap.get(product.stockGroupId) ||
                    null;
            }
            // Resolve unitId using lookup Maps
            let resolvedUnitId = null;
            if (product.unitId) {
                resolvedUnitId = unitByTallyMap.get(product.unitId) ||
                    unitByNameMap.get(product.unitId) ||
                    unitBySymbolMap.get(product.unitId) ||
                    null;
            }
            const existingByTally = productByTallyMap.get(product.tallyMasterId);
            if (existingByTally) {
                const updatedProduct = await tx.product.update({
                    where: { id: existingByTally.id },
                    data: {
                        tallyGuid: product.tallyGuid,
                        tallyAlterId: product.tallyAlterId,
                        stockGroupId: resolvedStockGroupId,
                        unitId: resolvedUnitId,
                        name: product.name,
                        brand: product.brand,
                        category: product.category,
                        costPrice: product.costPrice,
                        stockQty: product.tallyStockQty, // Tally is the source of truth for stock
                        tallyStockQty: product.tallyStockQty,
                        isActive: product.isActive,
                        tallyUpdatedAt: new Date(),
                    }
                });
                return { action: 'update', product: updatedProduct };
            }
            else {
                const existingBySku = productBySkuMap.get(product.sku);
                if (existingBySku) {
                    if (existingBySku.tallyMasterId === null) {
                        // Attach Tally identity to existing product
                        const updatedProduct = await tx.product.update({
                            where: { id: existingBySku.id },
                            data: {
                                tallyMasterId: product.tallyMasterId,
                                tallyGuid: product.tallyGuid,
                                tallyAlterId: product.tallyAlterId,
                                stockGroupId: resolvedStockGroupId,
                                unitId: resolvedUnitId,
                                name: product.name,
                                brand: product.brand,
                                category: product.category,
                                costPrice: product.costPrice,
                                stockQty: product.tallyStockQty, // Update stock as well
                                tallyStockQty: product.tallyStockQty,
                                isActive: product.isActive,
                                tallyUpdatedAt: new Date(),
                            }
                        });
                        return { action: 'attach', product: updatedProduct };
                    }
                    else {
                        // SKU exists but already attached to another Tally Master ID
                        throw new Error(`SKU ${product.sku} is already attached to another Tally Master ID`);
                    }
                }
                else {
                    // Create new product
                    const createdProduct = await tx.product.create({
                        data: {
                            tallyMasterId: product.tallyMasterId,
                            tallyGuid: product.tallyGuid,
                            tallyAlterId: product.tallyAlterId,
                            stockGroupId: resolvedStockGroupId,
                            unitId: resolvedUnitId,
                            sku: product.sku,
                            name: product.name,
                            brand: product.brand,
                            category: product.category,
                            costPrice: product.costPrice,
                            stockQty: product.stockQty,
                            tallyStockQty: product.tallyStockQty,
                            isActive: product.isActive,
                            tallyUpdatedAt: new Date(),
                        }
                    });
                    return { action: 'insert', product: createdProduct };
                }
            }
        };
        // Split products into batches (Batch size: 500)
        const BATCH_SIZE = 500;
        for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
            const batch = parsed.slice(i, i + BATCH_SIZE);
            // Clone maps in case the transaction rolls back
            const backupProductByTallyMap = new Map(productByTallyMap);
            const backupProductBySkuMap = new Map(productBySkuMap);
            let batchInserted = 0;
            let batchUpdated = 0;
            let batchAttached = 0;
            try {
                await prisma_1.prisma.$transaction(async (tx) => {
                    let localInserted = 0;
                    let localUpdated = 0;
                    let localAttached = 0;
                    for (const product of batch) {
                        const res = await processSingleProduct(tx, product);
                        if (res.action === 'insert') {
                            localInserted++;
                        }
                        else if (res.action === 'update') {
                            localUpdated++;
                        }
                        else if (res.action === 'attach') {
                            localAttached++;
                        }
                        // Update lookup maps immediately for subsequent products in the same batch
                        const lookupItem = {
                            id: res.product.id,
                            tallyMasterId: res.product.tallyMasterId,
                            sku: res.product.sku,
                        };
                        if (lookupItem.tallyMasterId) {
                            productByTallyMap.set(lookupItem.tallyMasterId, lookupItem);
                        }
                        productBySkuMap.set(lookupItem.sku, lookupItem);
                    }
                    batchInserted = localInserted;
                    batchUpdated = localUpdated;
                    batchAttached = localAttached;
                });
                inserted += batchInserted;
                updated += batchUpdated;
                attached += batchAttached;
            }
            catch (transactionError) {
                // Rollback lookup maps to pre-batch state
                productByTallyMap = backupProductByTallyMap;
                productBySkuMap = backupProductBySkuMap;
                // Fallback: process this batch one-by-one
                for (const product of batch) {
                    try {
                        await prisma_1.prisma.$transaction(async (tx) => {
                            const res = await processSingleProduct(tx, product);
                            if (res.action === 'insert') {
                                inserted++;
                            }
                            else if (res.action === 'update') {
                                updated++;
                            }
                            else if (res.action === 'attach') {
                                attached++;
                            }
                            // Update lookup maps immediately for subsequent fallback items
                            const lookupItem = {
                                id: res.product.id,
                                tallyMasterId: res.product.tallyMasterId,
                                sku: res.product.sku,
                            };
                            if (lookupItem.tallyMasterId) {
                                productByTallyMap.set(lookupItem.tallyMasterId, lookupItem);
                            }
                            productBySkuMap.set(lookupItem.sku, lookupItem);
                        });
                    }
                    catch (singleError) {
                        failed++;
                    }
                }
            }
        }
        return {
            success: true,
            message: "Processed successfully",
            count: inserted + updated + attached,
            inserted,
            updated,
            attached,
            failed
        };
    }
}
exports.SyncService = SyncService;
exports.syncService = new SyncService();
//# sourceMappingURL=sync.service.js.map