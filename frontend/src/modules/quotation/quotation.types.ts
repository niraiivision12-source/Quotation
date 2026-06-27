export type QuotationStatus =
  | "DRAFT"
  | "SENT"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export type ProjectPhase = "PIPES" | "WIRING" | "SWITCHES" | "LIGHTS" | "FANS";

export interface QuotationItemForm {
  id: string;

  productId?: string;

  productName?: string;

  sku?: string;

  quantity: number;

  costPrice: number;

  marginPercent: number;

  sellingPrice: number;

  totalPrice: number;

  search: string;

  showDropdown: boolean;
}

export interface CreateQuotationDTO {
  createdById?: string;

  type?: "LEAD" | "CUSTOMER" | "WALK_IN_CUSTOMER";

  leadId?: string;

  customerId?: string;

  projectId?: string;

  phase?: ProjectPhase | null;

  walkInName?: string;

  walkInMobile?: string;

  walkInEmail?: string | null;

  walkInAddress?: string | null;

  notes?: string;

  validUntil?: string;

  items: {
    productId: string;
    quantity: number;
    marginPercent: number;
  }[];
}

export interface Quotation {
  id: string;

  quotationNumber: string;

  type: "LEAD" | "CUSTOMER" | "WALK_IN_CUSTOMER";

  leadId?: string;

  customerId?: string;

  projectId?: string;

  phase?: ProjectPhase | null;

  walkInName?: string;

  walkInMobile?: string;

  walkInEmail?: string;

  walkInAddress?: string;

  version: number;

  status: QuotationStatus;

  subtotal: number;

  totalAmount: number;

  notes?: string;

  validUntil?: string;

  createdAt: string;
}

export interface QuotationTotals {
  subtotal: number;
  totalAmount: number;
}

export interface LeadOption {
  id: string;

  name: string;

  mobile: string;

  city?: string;
}

export interface CustomerOption {
  id: string;

  name: string;

  mobile: string;
}

export interface ProjectOption {
  id: string;

  projectName: string;

  customerId: string;
}
