import { ProjectPhase, QuotationStatus } from "@prisma/client";
import { z } from "zod";

export const createQuotationSchema = z.object({
  customerId: z.uuid(),
  projectId: z.uuid(),

  phase: z.enum(ProjectPhase),

  notes: z.string().optional(),

  validUntil: z.coerce.date().optional(),

  items: z.array(
    z.object({
      productId: z.uuid(),

      quantity: z.number().positive(),

      marginPercent: z.number().min(0),
    }),
  ),
});

export const updateQuotationStatusSchema = z.object({
  status: z.enum(QuotationStatus),
});
