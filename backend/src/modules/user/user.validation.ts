import { UserRole } from "@prisma/client";
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(UserRole),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(UserRole).optional(),
  isActive: z.boolean().optional(),
});
