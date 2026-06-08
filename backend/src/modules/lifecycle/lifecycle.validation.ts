import { LifecycleStatus } from "@prisma/client";
import { z } from "zod";

export const updatePhaseSchema = z.object({
  status: z.nativeEnum(LifecycleStatus),

  remarks: z.string().optional(),
});
