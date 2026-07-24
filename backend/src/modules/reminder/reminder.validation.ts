import {
  ReminderPriority,
  ReminderRepeatType,
  ReminderType,
  ReminderStatus,
} from "@prisma/client";
import { z } from "zod";

export const createReminderSchema = z.object({
  title: z.string().min(2),

  description: z.string().optional(),

  type: z.enum(ReminderType),

  priority: z.enum(ReminderPriority),

  dueAt: z.coerce.date(),

  repeatType: z.enum(ReminderRepeatType).optional(),

  opportunityId: z.uuid().optional(),

  customerId: z.uuid().optional(),

  paymentId: z.uuid().optional(),
});

export const updateReminderSchema = z.object({
  title: z.string().min(2).optional(),

  description: z.string().optional().nullable(),

  priority: z.enum(ReminderPriority).optional(),

  status: z.enum(ReminderStatus).optional(),

  dueAt: z.coerce.date().optional(),

  repeatType: z.enum(ReminderRepeatType).optional(),

  opportunityId: z.uuid().optional().nullable(),

  customerId: z.uuid().optional().nullable(),

  paymentId: z.uuid().optional().nullable(),
});
