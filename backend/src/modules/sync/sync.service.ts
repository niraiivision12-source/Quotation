import { prisma } from '../../lib/prisma';
import { z } from 'zod';
import { AppError } from '../../utils/app-error';
import { 
  syncStockGroupsPayloadSchema, 
  syncUnitsPayloadSchema, 
  syncProductsPayloadSchema 
} from './sync.validation';

export class SyncService {
  async syncStockGroups(data: unknown) {
    const parsed = syncStockGroupsPayloadSchema.parse(data);
    
    let inserted = 0;
    let updated = 0;
    let attached = 0;
    let failed = 0;

    await prisma.$transaction(async (tx) => {
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
          } else {
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
        } catch (error) {
          failed++;
        }
      }
    });

    return { success: true, inserted, updated, attached, failed };
  }

  async syncUnits(data: unknown) {
    const parsed = syncUnitsPayloadSchema.parse(data);

    let inserted = 0;
    let updated = 0;
    let attached = 0;
    let failed = 0;

    await prisma.$transaction(async (tx) => {
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
          } else {
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
        } catch (error) {
          failed++;
        }
      }
    });

    return { success: true, inserted, updated, attached, failed };
  }

  async syncProducts(data: unknown) {
    const parsed = syncProductsPayloadSchema.parse(data);

    // Verify relations exist before processing
    const stockGroupIds = Array.from(new Set(parsed.map(p => p.stockGroupId).filter(Boolean))) as string[];
    const unitIds = Array.from(new Set(parsed.map(p => p.unitId).filter(Boolean))) as string[];

    if (stockGroupIds.length > 0) {
      const existingGroups = await prisma.stockGroup.findMany({
        where: { tallyMasterId: { in: stockGroupIds } },
        select: { tallyMasterId: true }
      });
      const existingIds = new Set(existingGroups.map(g => g.tallyMasterId));
      for (const id of stockGroupIds) {
        if (!existingIds.has(id)) {
          throw new AppError(`Validation Error: StockGroup with tallyMasterId ${id} does not exist.`, 400);
        }
      }
    }

    if (unitIds.length > 0) {
      const existingUnits = await prisma.unit.findMany({
        where: { tallyMasterId: { in: unitIds } },
        select: { tallyMasterId: true }
      });
      const existingIds = new Set(existingUnits.map(u => u.tallyMasterId));
      for (const id of unitIds) {
        if (!existingIds.has(id)) {
          throw new AppError(`Validation Error: Unit with tallyMasterId ${id} does not exist.`, 400);
        }
      }
    }

    let inserted = 0;
    let updated = 0;
    let attached = 0;
    let failed = 0;

    await prisma.$transaction(async (tx) => {
      for (const product of parsed) {
        try {
          const existingByTally = await tx.product.findUnique({
            where: { tallyMasterId: product.tallyMasterId }
          });

          if (existingByTally) {
            await tx.product.update({
              where: { id: existingByTally.id },
              data: {
                tallyGuid: product.tallyGuid,
                tallyAlterId: product.tallyAlterId,
                stockGroupId: product.stockGroupId,
                unitId: product.unitId,
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
            updated++;
          } else {
            const existingBySku = await tx.product.findUnique({
              where: { sku: product.sku }
            });

            if (existingBySku) {
              if (existingBySku.tallyMasterId === null) {
                // Attach Tally identity to existing product
                await tx.product.update({
                  where: { id: existingBySku.id },
                  data: {
                    tallyMasterId: product.tallyMasterId,
                    tallyGuid: product.tallyGuid,
                    tallyAlterId: product.tallyAlterId,
                    stockGroupId: product.stockGroupId,
                    unitId: product.unitId,
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
                attached++;
              } else {
                // SKU exists but already attached to another Tally Master ID
                failed++;
              }
            } else {
              // Create new product
              await tx.product.create({
                data: {
                  tallyMasterId: product.tallyMasterId,
                  tallyGuid: product.tallyGuid,
                  tallyAlterId: product.tallyAlterId,
                  stockGroupId: product.stockGroupId,
                  unitId: product.unitId,
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
              inserted++;
            }
          }
        } catch (error) {
          failed++;
        }
      }
    });

    return { success: true, inserted, updated, attached, failed };
  }
}

export const syncService = new SyncService();
