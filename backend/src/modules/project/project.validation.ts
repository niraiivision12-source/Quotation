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
  paymentDetails: z.object({
    quotationId: z.string().uuid("Invalid quotation ID"),
    billNumber: z.string().optional().default(""),
    billDate: z.string().optional(),
    totalBillAmount: z.coerce.number().positive("Total Bill Amount must be positive"),
    initialAmountReceived: z.coerce.number().min(0, "Amount received cannot be negative").optional().default(0),
    allowCredit: z.boolean().default(false),
    dueDate: z.string().optional(),
    remarks: z.string().optional(),
    paymentMethod: z.string().optional().default("CASH"),
    referenceNumber: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }).optional(),
});

export const updateProjectPhaseSchema = z.object({
  phase: z.nativeEnum(ProjectPhase),
});
