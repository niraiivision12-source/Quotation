import { ProductCategory } from "@prisma/client";
import { z } from "zod";

export const createEnquirySchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  email: z.string().email().optional().nullable(),
  source: z.string().optional().default("MANUAL"),
  message: z.string().optional().nullable(),
});

export const triageEnquirySchema = z.object({
  category: z.nativeEnum(ProductCategory),
});
