import { ReminderPriority, ReminderType } from "@prisma/client";
import { z } from "zod";

export const createReminderSchema = z.object({
  title: z.string().min(2),

  description: z.string().optional(),

  type: z.nativeEnum(ReminderType),

  priority: z.nativeEnum(ReminderPriority),

  dueAt: z.coerce.date(),

  userId: z.string().uuid(),

  leadId: z.string().uuid().optional(),

  customerId: z.string().uuid().optional(),

  projectId: z.string().uuid().optional(),
});
