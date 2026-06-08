import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  email: z.string().email().optional(),
  address: z.string().optional(),
  assignedToId: z.string().optional(),
});
