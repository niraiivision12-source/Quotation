import {
  ProjectPhase,
  QuotationRevisionReason,
  QuotationStatus,
  QuotationType,
} from "@prisma/client";
import { z } from "zod";

const followUpSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueAt: z.coerce.date(),
}).optional();

export const createQuotationSchema = z.object({
  createdById: z.uuid().optional(),

  type: z.nativeEnum(QuotationType).default(QuotationType.LEAD),

  leadId: z.uuid().optional(),

  customerId: z.uuid().optional(),

  opportunityId: z.string().uuid().optional(),

  projectId: z.uuid().optional(),

  phase: z.nativeEnum(ProjectPhase).nullable().optional(),

  walkInName: z.string().optional(),

  walkInMobile: z.string().optional(),

  walkInEmail: z.string().nullable().optional(),

  walkInAddress: z.string().nullable().optional(),

  notes: z.string().optional(),

  validUntil: z.coerce.date().optional(),

  discountAmount: z.number().min(0).optional(),

  parentQuotationId: z.string().uuid().nullable().optional(),

  revisionReason: z.nativeEnum(QuotationRevisionReason).nullable().optional(),

  items: z.array(
    z.object({
      productId: z.uuid(),

      quantity: z.number().positive(),

      marginPercent: z.number().min(0).optional().nullable(),
      discountPercent: z.number().min(0).optional().nullable(),
      gstPercent: z.number().min(0).max(100).optional().nullable(),
    }),
  ),

  followUp: followUpSchema,
}).superRefine((data, ctx) => {
  if (data.opportunityId) {
    return;
  }
  if (data.type === QuotationType.LEAD) {
    if (!data.leadId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Lead ID is required for Lead quotation",
        path: ["leadId"],
      });
    }
  } else if (data.type === QuotationType.CUSTOMER) {
    if (!data.customerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Customer ID is required for Customer quotation",
        path: ["customerId"],
      });
    }
  } else if (data.type === QuotationType.WALK_IN_CUSTOMER) {
    if (!data.walkInName || !data.walkInName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Walk-in Customer Name is required",
        path: ["walkInName"],
      });
    }
    if (!data.walkInMobile || !data.walkInMobile.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Walk-in Customer Mobile is required",
        path: ["walkInMobile"],
      });
    }
  } else if (data.type === QuotationType.PURCHASE_ORDER) {
    if (!data.leadId && !data.customerId) {
      if (!data.walkInName || !data.walkInName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dealer Name is required",
          path: ["walkInName"],
        });
      }
      if (!data.walkInMobile || !data.walkInMobile.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dealer Mobile is required",
          path: ["walkInMobile"],
        });
      }
    }
  }
});

export const updateQuotationStatusSchema = z.object({
  status: z.enum(QuotationStatus),
  followUp: followUpSchema,
});

export const createRevisionSchema = z.object({
  revisionReason: z.enum(QuotationRevisionReason),
});
