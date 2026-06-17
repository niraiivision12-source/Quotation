import { LeadStatus } from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

export const createLeadSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  email: z.preprocess(emptyToUndefined, z.string().email().optional()),
  source: z.preprocess(emptyToUndefined, z.string().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
  assignedToId: z.preprocess(emptyToUndefined, z.string().optional()),
  contactOwnerId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  city: z.preprocess(emptyToUndefined, z.string().optional()),
  referralDate: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
});

export const convertLeadSchema = z.object({
  projectName: z.string().min(2),
  location: z.string().optional(),
  estimatedBudget: z.coerce.number().optional(),
});

export const updateLeadSchema = z.object({
  name: z.preprocess(emptyToUndefined, z.string().min(2).optional()),
  mobile: z.preprocess(emptyToUndefined, z.string().min(10).optional()),
  email: z.preprocess(emptyToUndefined, z.string().email().optional().nullable()),
  city: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  source: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  notes: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  referralDate: z.preprocess(emptyToUndefined, z.coerce.date().optional().nullable()),
  assignedToId: z.preprocess(emptyToUndefined, z.string().uuid().optional().nullable()),
  contactOwnerId: z.preprocess(emptyToUndefined, z.string().uuid().optional().nullable()),
  status: z.enum(LeadStatus).optional(),
  nextFollowUpAt: z.preprocess(emptyToUndefined, z.coerce.date().optional().nullable()),
});
