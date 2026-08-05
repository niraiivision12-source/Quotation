import { ProductCategory } from "@prisma/client";
import { z } from "zod";

export const createEnquirySchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  email: z.string().email().optional().nullable(),
  source: z.string().optional().default("MANUAL"),
  message: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
});

export const triageEnquirySchema = z.object({
  category: z.nativeEnum(ProductCategory),
  notes: z.string().optional().nullable(),
  projectName: z.string().optional().nullable(),
});

export const updateEnquirySchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().nullable(),
  city: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  source: z.string().optional(),
});

export const bulkActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "At least one ID is required"),
});
