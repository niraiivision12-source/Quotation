import { OpportunityStatus, ProductCategory, ProjectPhase } from "@prisma/client";
import { z } from "zod";

export const updateOpportunitySchema = z.object({
  status: z.nativeEnum(OpportunityStatus).optional(),
  estimatedValue: z.number().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  nextFollowUpAt: z.coerce.date().optional().nullable(),
  lostReason: z.string().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  nextPhase: z.nativeEnum(ProjectPhase).optional().nullable(),
  followUp: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    dueAt: z.coerce.date(),
  }).optional(),
}).refine((data) => {
  if (data.status === "WON" || data.status === "LOST") {
    return !!data.followUp && !!data.followUp.dueAt;
  }
  return true;
}, {
  message: "Follow-up is required when marking an opportunity as Won or Lost",
  path: ["followUp"],
}).refine((data) => {
  if (data.status === "LOST") {
    return !!data.lostReason && data.lostReason.trim().length > 0;
  }
  return true;
}, {
  message: "Lost reason is required when marking an opportunity as Lost",
  path: ["lostReason"],
}).refine((data) => {
  if (data.status === "WON" || data.status === "LOST") {
    return !!data.nextPhase;
  }
  return true;
}, {
  message: "Next phase is required when marking an opportunity as Won or Lost",
  path: ["nextPhase"],
});
