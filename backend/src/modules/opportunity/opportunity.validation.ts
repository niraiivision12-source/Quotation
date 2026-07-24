import { OpportunityStatus, ProductCategory } from "@prisma/client";
import { z } from "zod";

export const updateOpportunitySchema = z.object({
  status: z.nativeEnum(OpportunityStatus).optional(),
  estimatedValue: z.number().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  nextFollowUpAt: z.coerce.date().optional().nullable(),
  lostReason: z.string().optional().nullable(),
  followUp: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    dueAt: z.coerce.date(),
  }).optional(),
});
