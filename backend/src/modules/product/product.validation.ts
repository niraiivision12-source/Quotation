import { z } from "zod";

export const createProductSchema = z.object({
  sku: z.string().min(2),

  name: z.string().min(2),

  brand: z.string().optional(),

  category: z.string().optional(),

  unit: z.string().optional(),

  costPrice: z.coerce.number().positive(),

  stockQty: z.coerce.number().int().min(0),
});

export const updateProductSchema = z.object({
  sku: z.string().min(2).optional(),

  name: z.string().min(2).optional(),

  brand: z.string().optional().nullable(),

  category: z.string().optional().nullable(),

  unit: z.string().optional().nullable(),

  costPrice: z.coerce.number().positive().optional(),

  stockQty: z.coerce.number().int().min(0).optional(),
});
