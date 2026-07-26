import { z } from "zod";

export const createDealerSchema = z.object({
  name: z.string().min(2),
  contactPerson: z.string().optional().nullable(),
  mobile: z.string().min(10),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  gst: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
});

export const updateDealerSchema = z.object({
  name: z.string().min(2).optional(),
  contactPerson: z.string().optional().nullable(),
  mobile: z.string().min(10).optional(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  gst: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
});
