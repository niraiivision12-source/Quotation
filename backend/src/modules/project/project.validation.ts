import { ProjectPhase, ProjectStatus } from "@prisma/client";
import { z } from "zod";

export const createProjectSchema = z.object({
  customerId: z.string().uuid(),
  projectName: z.string().min(2),
  location: z.string().optional(),
  assignedToId: z.string().optional(),
  estimatedBudget: z.coerce.number().optional(),
  currentPhase: z.nativeEnum(ProjectPhase).optional(),
});

export const updateProjectSchema = z.object({
  projectName: z.string().min(2).optional(),
  location: z.string().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  estimatedBudget: z.coerce.number().optional(),
  isCompleted: z.boolean().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  startDate: z.coerce.date().optional().nullable(),
  expectedCompletion: z.coerce.date().optional().nullable(),
});

export const updateProjectPhaseSchema = z.object({
  phase: z.nativeEnum(ProjectPhase),
});
