import { z } from 'zod';

export const syncStockGroupSchema = z.object({
  tallyMasterId: z.string(),
  tallyGuid: z.string().optional().nullable(),
  tallyAlterId: z.number().optional().nullable(),
  name: z.string(),
  parentName: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true)
});

export const syncUnitSchema = z.object({
  tallyMasterId: z.string(),
  tallyGuid: z.string().optional().nullable(),
  tallyAlterId: z.number().optional().nullable(),
  name: z.string(),
  symbol: z.string(),
  isActive: z.boolean().optional().default(true)
});

export const syncProductSchema = z.object({
  tallyMasterId: z.string(),
  tallyGuid: z.string().optional().nullable(),
  tallyAlterId: z.number().optional().nullable(),
  stockGroupId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  
  // Necessary fields for product creation if it's new
  sku: z.string(),
  name: z.string(),
  brand: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  costPrice: z.number(),
  stockQty: z.number().optional().default(0),
  tallyStockQty: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true)
});

export const syncStockGroupsPayloadSchema = z.array(syncStockGroupSchema);
export const syncUnitsPayloadSchema = z.array(syncUnitSchema);
export const syncProductsPayloadSchema = z.array(syncProductSchema);
