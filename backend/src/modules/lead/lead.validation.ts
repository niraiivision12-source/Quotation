import { LeadStatus, ProjectPhase } from "@prisma/client";
import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  email: z.string().email().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  city: z.string().optional(),
  assignedToId: z.string().optional(),
});

export const convertLeadSchema = z.object({
  projectName: z.string().min(2),
  location: z.string().optional(),
  currentPhase: z.nativeEnum(ProjectPhase),
});

export const updateLeadSchema = z.object({
  name: z.string().min(2).optional(),

  mobile: z.string().min(10).optional(),

  email: z.string().email().optional().nullable(),

  source: z.string().optional().nullable(),

  notes: z.string().optional().nullable(),

  assignedToId: z.string().uuid().optional().nullable(),

  nextFollowUpAt: z.string().optional().nullable(),

  city: z.string().optional().nullable(),

  status: z.nativeEnum(LeadStatus).optional(),

  reason: z.string().optional(),

  followUp: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    dueAt: z.coerce.date(),
  }).optional(),

  followUpDate: z.coerce.date().optional(),
});
