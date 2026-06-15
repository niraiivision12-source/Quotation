export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "FOLLOW_UP"
  | "QUOTATION_SENT"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  source?: string;
  notes?: string;
  status: LeadStatus;
  contactOwner?: string;
  city?: string;
  referralDate?: string;
  assignedToId?: string;
  createdAt: string;
}

export interface LeadListResponse {
  items: Lead[];
  total: number;
  page: number;
  limit: number;
}
