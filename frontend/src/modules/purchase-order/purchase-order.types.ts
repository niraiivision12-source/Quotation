import type { Dealer } from "../dealer/dealer.types";

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  quantity: number;
  product?: {
    id: string;
    sku: string;
    name: string;
    brand?: string | null;
    unit?: string | null;
  };
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  dealerId: string;
  poDate: string;
  expectedDeliveryDate?: string | null;
  deliveryAddress?: string | null;
  notes?: string | null;
  status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED";
  version: number;
  parentPurchaseOrderId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  dealer?: Dealer;
  items: PurchaseOrderItem[];
  createdBy?: {
    id: string;
    name: string;
    role: string;
  };
  revisionReason?: string | null;

  dealerNameSnapshot: string;
  dealerContactPersonSnapshot?: string | null;
  dealerMobileSnapshot: string;
  dealerEmailSnapshot?: string | null;
  dealerAddressSnapshot?: string | null;
  dealerGstSnapshot?: string | null;

  companyNameSnapshot?: string | null;
  companyLogoSnapshot?: string | null;
  companyGstSnapshot?: string | null;
  companyAddressSnapshot?: string | null;
  companyPhoneSnapshot?: string | null;
  companyEmailSnapshot?: string | null;
  companyWebsiteSnapshot?: string | null;
  authorizedSignatureSnapshot?: string | null;
}

export interface CreatePurchaseOrderItemDTO {
  productId: string;
  quantity: number;
}

export interface CreatePurchaseOrderDTO {
  dealerId: string;
  expectedDeliveryDate?: string;
  deliveryAddress?: string;
  notes?: string;
  createdById?: string;
  items: CreatePurchaseOrderItemDTO[];
  parentPurchaseOrderId?: string;
  revisionReason?: string;
}
