export type OpportunityStatus =
  | "NEW"
  | "CONTACTED"
  | "QUOTATION_SENT"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export type ProductCategory =
  | "PIPES"
  | "WIRES"
  | "SWITCHES"
  | "LIGHTS"
  | "FANS"
  | "OTHERS";

export interface Opportunity {
  id: string;
  customerId: string;
  category: ProductCategory;
  status: OpportunityStatus;
  assignedToId?: string | null;
  estimatedValue?: string | number | null;
  source?: string | null;
  lostReason?: string | null;
  nextFollowUpAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    mobile: string;
    email?: string | null;
    city?: string | null;
  };
  assignedTo?: {
    id: string;
    name: string;
  } | null;
}

export interface OpportunityListResponse {
  items: Opportunity[];
  total: number;
  page: number;
  limit: number;
}
