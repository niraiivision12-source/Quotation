import { LeadStatus } from "@prisma/client";
import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  email: z.string().email().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
});

export const convertLeadSchema = z.object({
  projectName: z.string().min(2),
  location: z.string().optional(),
  estimatedBudget: z.coerce.number().optional(),
});

export const updateLeadSchema = z.object({
  name: z.string().min(2).optional(),

  mobile: z.string().min(10).optional(),

  email: z.string().email().optional().nullable(),

  source: z.string().optional().nullable(),

  notes: z.string().optional().nullable(),

  assignedToId: z.string().uuid().optional().nullable(),

  status: z.enum(LeadStatus).optional(),
});
