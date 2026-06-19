import { ProjectPhase, QuotationStatus } from "@prisma/client";
import { z } from "zod";

export const createLeadQuotationSchema = z.object({
  leadId: z.string().uuid(),

  phase: z.nativeEnum(ProjectPhase).optional(),

  notes: z.string().optional(),

  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      sellingPrice: z.number().positive(),
    }),
  ),
});

export const updateLeadQuotationStatusSchema = z.object({
  status: z.nativeEnum(QuotationStatus),
});
