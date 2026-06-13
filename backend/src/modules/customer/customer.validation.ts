import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  email: z.string().email().optional(),
  address: z.string().optional(),
  assignedToId: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  mobile: z.string().min(10).optional(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
});
