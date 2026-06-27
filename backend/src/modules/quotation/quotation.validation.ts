import {
  ProjectPhase,
  QuotationRevisionReason,
  QuotationStatus,
} from "@prisma/client";
import { z } from "zod";

const followUpSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueAt: z.coerce.date(),
}).optional();

export const createQuotationSchema = z.object({
  createdById: z.uuid().optional(),

  leadId: z.uuid().optional(),

  customerId: z.uuid().optional(),

  projectId: z.uuid().optional(),

  phase: z.enum(ProjectPhase).optional(),

  notes: z.string().optional(),

  validUntil: z.coerce.date().optional(),

  items: z.array(
    z.object({
      productId: z.uuid(),

      quantity: z.number().positive(),

      marginPercent: z.number().min(0),
    }),
  ),

  followUp: followUpSchema,
});

export const updateQuotationStatusSchema = z.object({
  status: z.enum(QuotationStatus),
  followUp: followUpSchema,
});

export const createRevisionSchema = z.object({
  revisionReason: z.enum(QuotationRevisionReason),
});
