export type QuotationStatus =
  | "DRAFT"
  | "SENT"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export type ProjectPhase = "PIPES" | "WIRING" | "SWITCHES" | "LIGHTS" | "FANS" | "OTHERS";

export interface QuotationItemForm {
  id: string;

  productId?: string;

  productName?: string;

  sku?: string;

  /** Carried from the picked product so the row can confirm the choice. */
  unit?: string;

  stockQty?: number;

  quantity: number;

  costPrice?: number;

  marginPercent?: number;

  mrp?: number;

  discountPercent?: number;

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

  discountAmount?: number;

  items: {
    productId: string;
    quantity: number;
    marginPercent?: number | null;
    discountPercent?: number | null;
  }[];

  parentQuotationId?: string;

  revisionReason?: string;

  followUp?: {
    dueAt: Date;
  };
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

  createdById?: string;

  discountAmount?: number;

  items?: any[];

  lead?: any;

  customer?: any;

  project?: any;
}

/** A row from `GET /quotations` — a lean projection, not the full Quotation. */
export interface QuotationListItem {
  id: string;

  quotationNumber: string;

  type: "LEAD" | "CUSTOMER" | "WALK_IN_CUSTOMER";

  phase?: ProjectPhase | null;

  version: number;

  status: QuotationStatus;

  totalAmount: number | string;

  createdAt: string;

  parentQuotationId?: string | null;

  revisionReason?: string | null;

  walkInName?: string;

  walkInMobile?: string;

  lead?: { id: string; name: string; mobile: string } | null;

  customer?: { id: string; name: string; mobile: string } | null;

  project?: { id: string; projectName: string } | null;
}

/** One entry in a revision chain, from `GET /quotations/:id/history`. */
export interface QuotationVersion {
  id: string;

  quotationNumber: string;

  version: number;

  status: QuotationStatus;

  phase?: ProjectPhase | null;

  subtotal: number | string;

  discountAmount?: number | string | null;

  totalAmount: number | string;

  revisionReason?: string | null;

  parentQuotationId?: string | null;

  notes?: string | null;

  validUntil?: string | null;

  createdAt: string;

  createdBy?: { id: string; name: string; role: string } | null;

  _count?: { items: number };
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
