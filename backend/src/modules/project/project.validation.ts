import { z } from "zod";

export const createProjectSchema = z.object({
  customerId: z.string().uuid(),
  projectName: z.string().min(2),
  location: z.string().optional(),
  assignedToId: z.string().optional(),
  estimatedBudget: z.coerce.number().optional(),
});
