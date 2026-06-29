import type { Reminder } from "@/modules/reminder/reminder.types";

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

  email?: string;

  source?: string;

  notes?: string;

  status: LeadStatus;

  assignedTo?: {
    id: string;
    name: string;
  };

  city?: string;

  assignedToId?: string;

  nextFollowUpAt?: string | null;

  createdAt: string;

  activities?: LeadActivity[];

  notesHistory?: LeadNoteHistory[];

  quotations?: LeadQuotation[];

  reminders?: Reminder[];

  customer?: {
    id: string;
    name: string;
  } | null;
}

export interface LeadNoteHistory {
  id: string;
  note: string;
  createdAt: string;

  user?: {
    id: string;
    name: string;
  };
}

export type LeadActivityType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "FOLLOW_UP_SET"
  | "FOLLOW_UP_COMPLETED"
  | "REMINDER_CREATED"
  | "REMINDER_COMPLETED"
  | "NOTE_ADDED"
  | "LOST"
  | "REOPENED"
  | "CONVERTED"
  | "QUOTATION_CREATED"
  | "QUOTATION_SENT"
  | "QUOTATION_APPROVED"
  | "QUOTATION_REJECTED";

export interface LeadNote {
  id: string;
  leadId: string;
  userId?: string;

  note: string;

  createdAt: string;

  user?: {
    id: string;
    name: string;
  };
}

export type QuotationStatus =
  | "DRAFT"
  | "SENT"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export interface LeadQuotationItem {
  id: string;

  productId: string;

  quantity: number;

  sellingPrice: string;

  totalPrice: string;

  product: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface LeadQuotation {
  id: string;

  quotationNumber: string;

  phase?: ProjectPhase;

  status: QuotationStatus;

  subtotal: string;

  totalAmount: string;

  notes?: string;

  sentAt?: string | null;

  approvedAt?: string | null;

  rejectedAt?: string | null;

  createdAt: string;

  items: LeadQuotationItem[];
}

export interface LeadActivity {
  id: string;
  leadId: string;
  userId?: string;
  type: LeadActivityType;
  message: string;
  createdAt: string;
  metadata?: any;
  user?: { id: string; name: string };
}

export interface LeadListResponse {
  items: Lead[];
  total: number;
  page: number;
  limit: number;
}

export type PhaseStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SKIPPED";
export type ProjectPhase = "PIPES" | "WIRING" | "SWITCHES" | "LIGHTS" | "FANS" | "OTHERS";

export interface PhaseTracking {
  id: string;
  phase: ProjectPhase;
  status: PhaseStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  remarks?: string | null;
}

export interface LeadLifecycle {
  id: string;
  projectName: string;
  phaseTracking: PhaseTracking[];
}
