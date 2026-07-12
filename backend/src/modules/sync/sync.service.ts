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

  async syncProducts(data: unknown) {
    const parsed = syncProductsPayloadSchema.parse(data);

    let inserted = 0;
    let updated = 0;
    let attached = 0;
    let failed = 0;

    await prisma.$transaction(async (tx) => {
      for (const product of parsed) {
        try {
          // Resolve stockGroupId (which is name or tallyMasterId in the payload)
          let resolvedStockGroupId: string | null = null;
          if (product.stockGroupId) {
            const sg = await tx.stockGroup.findFirst({
              where: {
                OR: [
                  { tallyMasterId: product.stockGroupId },
                  { name: product.stockGroupId }
                ]
              }
            });
            if (sg) {
              resolvedStockGroupId = sg.tallyMasterId;
            }
          }

          // Resolve unitId (which is name or symbol or tallyMasterId in the payload)
          let resolvedUnitId: string | null = null;
          if (product.unitId) {
            const u = await tx.unit.findFirst({
              where: {
                OR: [
                  { tallyMasterId: product.unitId },
                  { name: product.unitId },
                  { symbol: product.unitId }
                ]
              }
            });
            if (u) {
              resolvedUnitId = u.tallyMasterId;
            }
          }

          const existingByTally = await tx.product.findUnique({
            where: { tallyMasterId: product.tallyMasterId }
          });

          if (existingByTally) {
            await tx.product.update({
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
              inserted++;
            }
          }
        } catch (error) {
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
}

export const syncService = new SyncService();
