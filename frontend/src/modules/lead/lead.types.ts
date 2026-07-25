export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "NOT_RESPONDING"
  | "QUOTATION_SENT"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  city?: string | null;
  source?: string | null;
  status: LeadStatus;
  notes?: string | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
  estimatedValue?: number | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface LeadListResponse {
  items: Lead[];
  total: number;
  page: number;
  limit: number;
}
