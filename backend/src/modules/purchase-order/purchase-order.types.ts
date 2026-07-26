import { PurchaseOrderStatus } from "@prisma/client";

export interface CreatePurchaseOrderItemDTO {
  productId: string;
  quantity: number;
}

export interface CreatePurchaseOrderDTO {
  dealerId: string;
  expectedDeliveryDate?: string | Date;
  deliveryAddress?: string;
  notes?: string;
  createdById?: string;
  items: CreatePurchaseOrderItemDTO[];
  parentPurchaseOrderId?: string;
  revisionReason?: string;
}

export interface UpdatePurchaseOrderStatusDTO {
  status: PurchaseOrderStatus;
}
