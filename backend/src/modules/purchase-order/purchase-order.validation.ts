import { z } from "zod";
import { PurchaseOrderStatus } from "@prisma/client";

export const createPurchaseOrderSchema = z.object({
  dealerId: z.string().uuid(),
  expectedDeliveryDate: z.coerce.date().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdById: z.string().uuid().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().positive(),
    })
  ).min(1),
  parentPurchaseOrderId: z.string().uuid().optional().nullable(),
  revisionReason: z.string().optional().nullable(),
});

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.nativeEnum(PurchaseOrderStatus),
});

export const createPurchaseOrderRevisionSchema = z.object({
  revisionReason: z.string().min(2),
});

export const updatePurchaseOrderSchema = z.object({
  dealerId: z.string().uuid().optional(),
  expectedDeliveryDate: z.coerce.date().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().positive(),
    })
  ).min(1).optional(),
});

