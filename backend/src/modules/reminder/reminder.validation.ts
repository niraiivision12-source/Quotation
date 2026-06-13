import {
  ReminderPriority,
  ReminderRepeatType,
  ReminderType,
} from "@prisma/client";
import { z } from "zod";

export const createReminderSchema = z.object({
  title: z.string().min(2),

  description: z.string().optional(),

  type: z.enum(ReminderType),

  priority: z.enum(ReminderPriority),

  dueAt: z.coerce.date(),

  leadId: z.uuid().optional(),

  customerId: z.uuid().optional(),

  projectId: z.uuid().optional(),
});

export const updateReminderSchema = z.object({
  title: z.string().min(2).optional(),

  description: z.string().optional().nullable(),

  priority: z.enum(ReminderPriority).optional(),

  dueAt: z.coerce.date().optional(),

  repeatType: z.enum(ReminderRepeatType).optional(),
});
