import { TaskPriority, TaskStatus } from "@prisma/client";

import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(2),

  description: z.string().optional(),

  priority: z.enum(TaskPriority),

  dueAt: z.coerce.date().optional(),

  assignedToId: z.uuid(),

  leadId: z.uuid().optional(),

  customerId: z.uuid().optional(),

  projectId: z.uuid().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),

  description: z.string().optional().nullable(),

  priority: z.enum(TaskPriority).optional(),

  status: z.enum(TaskStatus).optional(),

  dueAt: z.coerce.date().optional(),

  assignedToId: z.uuid().optional(),

  leadId: z.uuid().optional().nullable(),

  customerId: z.uuid().optional().nullable(),

  projectId: z.uuid().optional().nullable(),
});
